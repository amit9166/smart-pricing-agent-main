from app.tools.mongodb import save_sentiment, save_agent_log
from app.tools.gemini_client import generate_sentiment_analysis

async def sentiment_agent_node(state: dict) -> dict:
    product_info = state.get("product_info")
    product_id = state.get("product_id")
    run_id = state.get("run_id")
    logs = state.get("logs", [])
    
    if not product_info:
        return state
        
    print(f"[{run_id}] [Sentiment Agent] Analyzing market sentiment for product: {product_info['name']}")
    save_agent_log(run_id, product_id, "Sentiment Agent", "started", "Analyzing social media discussions and reviews...", {})
    
    # Gather mock raw reviews / forum comments for the product
    # In production, we'd scrape Reddit/Amazon API. Here, we bundle dynamic mock feedback.
    market_data = f"""
    Reddit posts:
    - "Absolutely love my new {product_info['name']}! The performance is outstanding."
    - "Is {product_info['name']} worth the premium over competitors? Yes, build quality is 10/10."
    - "Wish the {product_info['name']} went on sale. Hard to justify full MSRP but standard is decent."
    Reviews:
    - "5 stars: Reliable, elegant, and fits my workspace. Highly recommend."
    - "4 stars: Great product, but customer service was slightly slow on shipping."
    """
    
    sentiment_result = generate_sentiment_analysis(product_info["name"], market_data)
    
    # Save sentiment directly in MongoDB
    save_sentiment(
        product_id,
        demand_score=sentiment_result["demandScore"],
        sentiment_score=sentiment_result["sentimentScore"],
        positive_count=3, # Mock detail count
        negative_count=0, # Mock detail count
        trend_summary=sentiment_result["trendSummary"]
    )
    
    logs.append(f"Sentiment analysis generated: Sentiment={sentiment_result['sentimentScore']}, Demand={sentiment_result['demandScore']}")
    save_agent_log(
        run_id,
        product_id,
        "Sentiment Agent",
        "success",
        f"Analyzed sentiment score: {sentiment_result['sentimentScore']} (Demand score: {sentiment_result['demandScore']})",
        sentiment_result
    )
    
    return {
        "sentiment": sentiment_result,
        "logs": logs
    }
