import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import crud
from functools import wraps

def safe_numeric(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        clean_kwargs = {}
        for k, v in kwargs.items():
            if isinstance(v, str) and v.replace('.', '', 1).lstrip('-').isdigit():
                clean_kwargs[k] = float(v) if '.' in v else int(v)
            else:
                clean_kwargs[k] = v
        return func(*args, **clean_kwargs)
    return wrapper

@safe_numeric
def calculate_storage_cost(days: int) -> str:
    days = int(days)

def calculate_storage_cost(days: int) -> str:
    """Расчёт стоимости хранения в пункте выдачи"""
    try:
        days = int(days)
    except (ValueError, TypeError):
        return json.dumps({"error": "days должен быть целым числом"}, ensure_ascii=False)
    
    if days <= 0:
        return json.dumps({"error": "Срок хранения должен быть больше 0"}, ensure_ascii=False)
    
    free_days = 7
    rate_per_day = 50
    max_days = 14
    
    if days <= free_days:
        cost = 0
        warning = None
    elif days <= max_days:
        cost = (days - free_days) * rate_per_day
        warning = None
    else:
        cost = (max_days - free_days) * rate_per_day
        warning = f"Максимальный срок хранения — {max_days} дней (код: RTN-14)"
    
    return json.dumps({
        "calculation": "STORAGE-CALC-V1",
        "days_requested": days,
        "free_days": free_days,
        "paid_days": max(0, min(days, max_days) - free_days),
        "rate_per_day": rate_per_day,
        "total_cost_rub": cost,
        "warning": warning
    }, ensure_ascii=False)


def calculate_volumetric_weight(length_cm: int, width_cm: int, height_cm: int) -> str:
    try:
        length_cm = int(length_cm)
        width_cm = int(width_cm)
        height_cm = int(height_cm)
    except (ValueError, TypeError):
        return json.dumps({"error": "Все размеры должны быть целыми числами"}, ensure_ascii=False)
    
    if any(x <= 0 for x in [length_cm, width_cm, height_cm]):
        return json.dumps({"error": "Все размеры должны быть больше 0"}, ensure_ascii=False)
    
    volumetric = (length_cm * width_cm * height_cm) / 5000
    return json.dumps({
        "calculation": "VOL-W-5K",
        "dimensions_cm": f"{length_cm}×{width_cm}×{height_cm}",
        "volumetric_weight_kg": round(volumetric, 2),
        "note": "Тариф применяется к большему из: фактический вес или объёмный"
    }, ensure_ascii=False)


def calculate_shipping_cost(
    weight_kg: float,
    distance_km: int,
    is_fragile: bool = False,
    zone: str = "standard"
) -> str:
    """Базовый расчёт стоимости доставки"""
    base_rate_per_km = 15
    fragile_markup = 1.25
    zone_multipliers = {
        "standard": 1.0,
        "north": 1.8,
        "express": 2.5,
        "international": 3.0
    }
    
    multiplier = zone_multipliers.get(zone, 1.0)
    cost = weight_kg * distance_km * base_rate_per_km * multiplier
    if is_fragile:
        cost *= fragile_markup
    
    return json.dumps({
        "calculation": "SHIP-CALC-V2",
        "weight_kg": weight_kg,
        "distance_km": distance_km,
        "zone": zone,
        "zone_multiplier": multiplier,
        "fragile_surcharge": "25%" if is_fragile else "0%",
        "estimated_cost_rub": round(cost, 2),
        "note": "Итоговая стоимость может отличаться после оценки габаритов"
    }, ensure_ascii=False)


def estimate_delivery_date(origin_city: str, destination_city: str, service_type: str = "standard") -> str:
    """Ориентировочный расчёт срока доставки"""

    base_days = {
        "same_region": 1,
        "neighbor_region": 2,
        "rf_standard": 3,
        "rf_remote": 5,
        "eaeu": 7,
        "international": 14
    }
    
    service_multipliers = {
        "standard": 1,
        "express": 0.5,
        "economy": 1.5
    }
    
    dest_lower = destination_city.lower()
    if any(x in dest_lower for x in ["якут", "чукот", "камчат", "магадан"]):
        route = "rf_remote"
    elif any(x in dest_lower for x in ["казах", "беларус", "армен", "киргиз"]):
        route = "eaeu"
    elif origin_city.lower() == destination_city.lower():
        route = "same_region"
    else:
        route = "rf_standard"
    
    days = base_days.get(route, 3)
    days = int(days * service_multipliers.get(service_type, 1))
    
    estimated_date = (datetime.now() + timedelta(days=days)).strftime("%d.%m.%Y")
    
    return json.dumps({
        "calculation": "DELIVERY-ETA-V1",
        "origin": origin_city,
        "destination": destination_city,
        "service_type": service_type,
        "estimated_days": days,
        "estimated_date": estimated_date,
        "note": "Срок ориентировочный. Точная дата — после приёма груза"
    }, ensure_ascii=False)


def validate_package_dimensions(length_cm: int, width_cm: int, height_cm: int) -> str:

    max_std = 120
    max_xl = 300
    
    issues = []
    if any(x > max_xl for x in [length_cm, width_cm, height_cm]):
        issues.append(f"Превышен максимальный габарит {max_xl} см — требуется спецтранспорт")
    
    category = "standard"
    if any(x > max_std for x in [length_cm, width_cm, height_cm]):
        category = "oversize"
        issues.append(f"Габариты превышают стандарт ({max_std} см) — тариф 'Крупногабарит' (+35%, код: XL-CARGO-35)")
    
    return json.dumps({
        "validation": "PKG-VALID-V1",
        "dimensions_cm": f"{length_cm}×{width_cm}×{height_cm}",
        "category": category,
        "issues": issues if issues else None,
        "status": "accepted" if not any("требуется спецтранспорт" in i for i in issues) else "manual_review"
    }, ensure_ascii=False)


def get_insurance_quote(declared_value_rub: float, category: str = "standard") -> str:
    """Расчёт стоимости страховки"""
    plans = {
        "basic": {"name": "Базовая (INS-BASE)", "coverage": 10000, "rate": 0.02, "franchise": 0.10},
        "pro": {"name": "Профи (INS-PRO)", "coverage": 100000, "rate": 0.035, "franchise": 0.05},
        "premium": {"name": "Премиум (INS-PREM)", "coverage": 500000, "rate": 0.05, "franchise": 0.0}
    }
    
    if declared_value_rub <= 10000:
        plan = plans["basic"]
    elif declared_value_rub <= 100000:
        plan = plans["pro"]
    else:
        plan = plans["premium"]
    
    premium = declared_value_rub * plan["rate"]
    
    return json.dumps({
        "calculation": "INS-QUOTE-V1",
        "declared_value_rub": declared_value_rub,
        "recommended_plan": plan["name"],
        "coverage_limit_rub": plan["coverage"],
        "franchise": f"{plan['franchise']*100:.0f}%",
        "premium_rub": round(premium, 2),
        "note": "При ущербе выплата = макс(0, ущерб - франшиза). Код процедуры: CLAIM-72H-F12"
    }, ensure_ascii=False)


def get_order_status(db: Session, tracking_number: str, current_user_id: int) -> str:
    order = crud.get_order_by_tracking(db, tracking_number)
    if not order:
        return json.dumps({"error": "Заказ с таким трек-номером не найден", "code": "ERR-TRK-404"})
    if order.user_id != current_user_id:
        return json.dumps({"error": "Нет прав на просмотр", "code": "ERR-AUTH-403"})
    
    return json.dumps({
        "tracking_number": order.tracking_number,
        "status": order.status.value,
        "origin": order.origin,
        "destination": order.destination,
        "weight_kg": order.weight,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "meta": "ORDER-STATUS-V1"
    }, ensure_ascii=False)


def get_prohibited_items(query: str = "") -> str:
    """Поиск по списку запрещённых/ограниченных грузов"""

    items = {
        "ZB-07": "Легковоспламеняющиеся жидкости, аккумуляторы >100 Вт·ч без UN38.3",
        "ZB-LTD": "Парфюмерия, аэрозоли — только наземным транспортом, код: GROUND-ONLY-DEC",
        "ZB-WEAPON": "Любые виды оружия, боеприпасы, имитаторы с оранжевым наконечником"
    }
    
    result = {k: v for k, v in items.items() if query.lower() in v.lower() or not query}
    
    return json.dumps({
        "search": "PROHIBITED-SEARCH-V1",
        "query": query,
        "results": result,
        "note": "Полный список — в разделе 'Правила' ЛК, код документа: RULES-ZB-2026"
    }, ensure_ascii=False)


TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "calculate_storage_cost",
            "description": "Рассчитать стоимость хранения посылки в пункте выдачи. Используй, если спрашивают про дни хранения или продление.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Количество дней хранения"}
                },
                "required": ["days"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_volumetric_weight",
            "description": "Рассчитать объёмный вес груза по формуле (Д×Ш×В)/5000. Нужен для тарификации.",
            "parameters": {
                "type": "object",
                "properties": {
                    "length_cm": {"type": "integer"},
                    "width_cm": {"type": "integer"},
                    "height_cm": {"type": "integer"}
                },
                "required": ["length_cm", "width_cm", "height_cm"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_shipping_cost",
            "description": "Оценить стоимость доставки. Учитывает вес, расстояние, зону и хрупкость.",
            "parameters": {
                "type": "object",
                "properties": {
                    "weight_kg": {"type": "number"},
                    "distance_km": {"type": "integer"},
                    "is_fragile": {"type": "boolean", "default": False},
                    "zone": {"type": "string", "enum": ["standard", "north", "express", "international"]}
                },
                "required": ["weight_kg", "distance_km"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "estimate_delivery_date",
            "description": "Оценить дату доставки по городам отправления и получения.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin_city": {"type": "string"},
                    "destination_city": {"type": "string"},
                    "service_type": {"type": "string", "enum": ["standard", "express", "economy"], "default": "standard"}
                },
                "required": ["origin_city", "destination_city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "validate_package_dimensions",
            "description": "Проверить, проходят ли габариты упаковки по стандартам. Вернёт категорию и предупреждения.",
            "parameters": {
                "type": "object",
                "properties": {
                    "length_cm": {"type": "integer"},
                    "width_cm": {"type": "integer"},
                    "height_cm": {"type": "integer"}
                },
                "required": ["length_cm", "width_cm", "height_cm"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_insurance_quote",
            "description": "Рассчитать стоимость страховки груза по объявленной ценности.",
            "parameters": {
                "type": "object",
                "properties": {
                    "declared_value_rub": {"type": "number"},
                    "category": {"type": "string", "enum": ["basic", "pro", "premium"], "default": "basic"}
                },
                "required": ["declared_value_rub"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_order_status",
            "description": "Получить информацию о заказе по трек-номеру.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tracking_number": {"type": "string"}
                },
                "required": ["tracking_number"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_prohibited_items",
            "description": "Проверить, можно ли перевозить определённый тип груза. Поиск по списку запрещённых.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Что ищем: 'аккумулятор', 'жидкость', 'оружие' и т.п."}
                },
                "required": ["query"]
            }
        }
    }
]