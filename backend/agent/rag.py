import chromadb

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="logistics_knowledge")

def get_relevant_context(user_message: str) -> str:
    try:
        results = collection.query(
            query_texts=[user_message],
            n_results=3
        )
        
        print(f"\n[RAG DEBUG] Запрос: '{user_message}'")
        if results and results['documents'] and results['documents'][0]:
            print(f"[RAG DEBUG] Найдено документов: {len(results['documents'][0])}")
            for i, doc in enumerate(results['documents'][0]):
                print(f"  [{i}] {doc[:150]}...")
        
        if results and results['documents'] and results['documents'][0]:
            context_docs = "\n• ".join(results['documents'][0])
            return f"""📋 БАЗА ЗНАНИЙ (ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЙ ЭТИ ДАННЫЕ):
            {context_docs}

            ❗ ИНСТРУКЦИЯ:
            - Если вопрос про упаковку — цитируй правила из базы дословно
            - Если вопрос про стоимость хранения — считай: 7 дней бесплатно, далее 50₽/день
            - Если срок >14 дней — предупреждай, что максимальный срок хранения 14 дней"""
            
    except Exception as e:
        print(f"[RAG ERROR]: {e}")
        
    print("[RAG WARN] Контекст не найден, возвращаем пустой")
    return ""