import chromadb

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="logistics_knowledge")

def get_relevant_context(user_message: str) -> str:
    try:
        results = collection.query(
            query_texts=[user_message],
            n_results=3
        )

        docs = None
        if results and results.get("documents") and results["documents"] and results["documents"][0]:
            docs = results["documents"][0]

        if docs:
            # Возвращаем только документы без дополнительных инструкций/эмодзи,
            # чтобы модель не выдумывала коды и правила.
            return "\n".join(docs)
            
    except Exception as e:
        print(f"[RAG ERROR]: {e}")
        
    return ""