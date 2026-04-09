# agent/core.py
from openai import OpenAI
import json
import inspect
from sqlalchemy.orm import Session
from database import models
from config import OLLAMA_BASE_URL, OLLAMA_MODEL_NAME
from agent.tools import (
    TOOLS_SCHEMA,
    get_order_status,
    calculate_storage_cost,
    calculate_volumetric_weight,
    calculate_shipping_cost,
    estimate_delivery_date,
    validate_package_dimensions,
    get_insurance_quote,
    get_prohibited_items,
    get_my_orders
)
from agent.rag import get_relevant_context

client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="ollama")
MODEL_NAME = OLLAMA_MODEL_NAME
MAX_TOOL_ITERATIONS = 3

TOOL_REGISTRY = {
    "get_order_status": get_order_status,
    "calculate_storage_cost": calculate_storage_cost,
    "calculate_volumetric_weight": calculate_volumetric_weight,
    "calculate_shipping_cost": calculate_shipping_cost,
    "estimate_delivery_date": estimate_delivery_date,
    "validate_package_dimensions": validate_package_dimensions,
    "get_insurance_quote": get_insurance_quote,
    "get_prohibited_items": get_prohibited_items,
    "get_my_orders": get_my_orders,
}


def clean_response_for_user(text: str) -> str:
    """Убирает технические маркеры и форматирование из ответа модели"""
    import re
    if not text:
        return text
    # Убираем упоминания внутренних кодов расчётов
    text = re.sub(r'\(расчёт:\s*[^\)]+\)', '', text)
    text = re.sub(r'\bSTORAGE-CALC-V1\b', '', text)
    text = re.sub(r'\bVOL-W-5K\b', '', text)
    text = re.sub(r'\bSHIP-CALC-V2\b', '', text)
    text = re.sub(r'\bPKG-VALID-V1\b', '', text)
    text = re.sub(r'\bINS-QUOTE-V1\b', '', text)
    # Убираем Markdown-разметку
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    # Убираем лишние пробелы и пустые строки
    text = re.sub(r'\n\s*\n', '\n', text)
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def generate_ai_response(db: Session, chat_id: int, user_id: int, user_message: str) -> str:
    try:
        chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
        messages = []

        rag_context = get_relevant_context(user_message)

        if not rag_context or rag_context.strip() == "":
            rag_context = "Общие правила логистики: соблюдай стандарты упаковки, тарифы и сроки."

        system_prompt = f"""Ты профессиональный ИИ-ассистент логистической компании.

ПРАВИЛА ИСТОЧНИКОВ:
1. База знаний (ниже) — используй для правил упаковки, хранения, запретов.
2. Инструменты — ОБЯЗАТЕЛЬНО вызывай для ВСЕХ расчётов (стоимость, вес, сроки, страховка). НЕ считай в уме.
3. История чата — учитывай контекст предыдущих сообщений.

ФОРМАТ ОТВЕТА:
- Без md разметки
- Никаких эмодзи, смайликов, декоративных символов
- Только чистый текст, нумерованные/маркированные списки
- При использовании RAG указывай код правила (напр. ПРАВИЛО-УП-01)
- При использовании калькулятора указывай код расчёта (напр. STORAGE-CALC-V1)
- Отвечай кратко, по делу, на языке пользователя.

БАЗА ЗНАНИЙ:
{rag_context}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Если отвечаешь про упаковку/хранение/запреты — начинай абзац с кода из базы: [ПРАВИЛО-УП-01], [ПРАВИЛО-ХР-01] и т.п.
- Не используй: эмодзи, жирный шрифт (**), курсив (_), код (`), разделители (---, ***)
- Если расчёт сделан через инструмент — укажи его код: (расчёт: STORAGE-CALC-V1)

КРИТИЧЕСКИ ВАЖНО:
- Если в Базе Знаний нет правила по теме вопроса — прямо скажи: «Правил для [тема] не найдено в базе».
- НИКОГДА не придумывай коды правил (ПРАВИЛО-XXX-XX), которых нет в базе.
- Если не уверен — лучше не указывай код, чем указать выдуманный.
"""

        messages.append({"role": "system", "content": system_prompt})

        if chat and chat.messages:
            for msg in chat.messages[-10:]:
                role = "assistant" if msg.sender_role == models.SenderRoleEnum.bot else "user"
                messages.append({"role": role, "content": msg.content})

        messages.append({"role": "user", "content": user_message})

        for _ in range(MAX_TOOL_ITERATIONS):
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=messages,
                    tools=TOOLS_SCHEMA,
                    tool_choice="auto",
                    temperature=0.2,
                )
            except Exception:
                return "Сервис поддержки временно недоступен. Попробуйте позже или дождитесь ответа модератора."
            assistant_msg = response.choices[0].message

            if not assistant_msg.tool_calls:
                return clean_response_for_user(assistant_msg.content) or "Ответ не сформирован."

            messages.append(assistant_msg)

            for tc in assistant_msg.tool_calls:
                func_name = tc.function.name
                print(f"\n[TOOL] Вызов: {func_name}")

                try:
                    args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    result = json.dumps({"error": "Невалидный JSON аргументов"})
                    print(f"[ERROR] {func_name}: не удалось распарсить аргументы")
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": func_name,
                        "content": result
                    })
                    continue

                func = TOOL_REGISTRY.get(func_name)
                if not func:
                    result = json.dumps({"error": f"Инструмент '{func_name}' не зарегистрирован"})
                else:
                    sig = inspect.signature(func)
                    kwargs = args.copy()
                    if "db" in sig.parameters:
                        kwargs["db"] = db
                    # get_order_status требует id пользователя, но schema его не просит у модели
                    if "current_user_id" in sig.parameters and "current_user_id" not in kwargs:
                        kwargs["current_user_id"] = user_id
                    result = func(**kwargs)

                print(f"[TOOL] Результат: {result[:180]}...")
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": func_name,
                    "content": result
                })

        print("[WARN] Превышен лимит вызовов инструментов")
        final = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.2,
        )

        return clean_response_for_user(final.choices[0].message.content) or "Лимит итераций исчерпан"

    except Exception as e:
        print(f"\n❌ CORE ERROR: {e}")
        return clean_response_for_user("Произошла внутренняя ошибка обработки запроса")