from app.tools.chroma_memory import query_similar_decisions
from app.tools.mongodb import save_agent_log

async def memory_agent_node(state: dict) -> dict:
    product_info = state.get("product_info")
    product_id = state.get("product_id")
    run_id = state.get("run_id")
    sentiment = state.get("sentiment", {})
    logs = state.get("logs", [])
    
    if not product_info:
        return state
        
    print(f"[{run_id}] [Memory Agent] Querying vector memory for similar pricing contexts...")
    save_agent_log(run_id, product_id, "Memory Agent", "started", "Retrieving historical pricing decisions from ChromaDB...", {})
    
    # Construct a search query reflecting the current market state
    query_text = f"Product: {product_info['name']} SKU: {product_info['sku']} Sentiment Score: {sentiment.get('sentimentScore', 0.0)} Demand Score: {sentiment.get('demandScore', 5)}"
    
    # Query Chroma DB vector memory
    similar_cases = query_similar_decisions(query_text, n_results=3)
    
    logs.append(f"Retrieved {len(similar_cases)} historical pricing matches from vector memory.")
    save_agent_log(
        run_id,
        product_id,
        "Memory Agent",
        "success",
        f"Found {len(similar_cases)} relevant historical pricing decisions in vector memory.",
        {"query": query_text, "similar_cases": similar_cases}
    )
    
    return {
        "similar_cases": similar_cases,
        "logs": logs
    }
