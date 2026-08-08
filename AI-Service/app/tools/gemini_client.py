import os
import json
import re
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("[Gemini Client] API client configured successfully.")
else:
    print("[Gemini Client] WARNING: GEMINI_API_KEY is not set. Using simulator mode.")

def generate_sentiment_analysis(product_name: str, market_data: str) -> dict:
    """
    Invokes Gemini to analyze product sentiment and demand.
    Returns: { "sentimentScore": float, "demandScore": int, "trendSummary": str }
    """
    prompt = f"""
    You are an expert market analyst. Analyze the following competitor e-commerce reviews, social comments, and news reports for "{product_name}".
    
    Market Data:
    {market_data}
    
    Provide the analysis in EXACTLY the following JSON format:
    {{
        "sentimentScore": <float between -1.0 and 1.0 representing sentiment polarity>,
        "demandScore": <integer between 1 and 10 representing demand level>,
        "trendSummary": "<a brief 1-2 sentence description of the current trend, e.g. 'Highly positive demand due to viral TikTok reviews, stock is running low across platforms.'>"
    }}
    Do not add markdown formatting, code blocks, or explanations outside the JSON structure.
    """
    
    if not GEMINI_API_KEY:
        # Fallback simulator
        import random
        sentiment = round(random.uniform(0.1, 0.8), 2)
        demand = random.randint(6, 9)
        trends = [
            f"Strong positive reviews for {product_name} on social media. Mentions of high build quality.",
            f"Increased discussions about {product_name} on tech blogs. Positive demand sentiment overall.",
            f"High volume of Reddit queries about stock availability for {product_name}."
        ]
        return {
            "sentimentScore": sentiment,
            "demandScore": demand,
            "trendSummary": random.choice(trends)
        }

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean JSON blocks if LLM wrapped it in markdown
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(text)
        return {
            "sentimentScore": float(data.get("sentimentScore", 0.0)),
            "demandScore": int(data.get("demandScore", 5)),
            "trendSummary": str(data.get("trendSummary", "Stable demand. No major sentiment spikes detected."))
        }
    except Exception as e:
        print(f"[Gemini Client] Sentiment API call error: {e}. Falling back to simulations...")
        return {
            "sentimentScore": 0.25,
            "demandScore": 6,
            "trendSummary": f"Moderate demand interest. Users find {product_name} functional but suggest looking for discounts."
        }

def generate_pricing_recommendation(product_info: dict, competitors: list, memories: list, sentiment: dict) -> dict:
    """
    Invokes Gemini reasoning to analyze constraints, historical context, and sentiment to propose an updated price.
    Returns: { "price": float, "confidence": float, "reasoning": str }
    """
    competitors_str = "\n".join([
        f"- {c['name']}: Current Scraped Price=${c.get('lastScrapedPrice')}, Rating={c.get('lastScrapedRating')}, Discount={c.get('lastScrapedDiscount')}%"
        for c in competitors if c.get('lastScrapedPrice') is not None
    ])
    
    memories_str = "\n".join([
        f"- Case: {m['document']} (Old Price: ${m['metadata'].get('old_price')}, New Price: ${m['metadata'].get('new_price')})"
        for m in memories
    ])

    prompt = f"""
    You are an autonomous dynamic pricing agent. Recommend the optimal selling price for the following product:
    
    PRODUCT DETAILS:
    - Name: {product_info['name']}
    - SKU: {product_info['sku']}
    - Cost Price: ${product_info['costPrice']}
    - Current Selling Price: ${product_info['sellingPrice']}
    - Current Inventory: {product_info['currentInventory']} units
    
    COMPETITOR PRICES:
    {competitors_str or "No active competitor scrapings found."}
    
    MARKET SENTIMENT:
    - Sentiment Score (-1.0 to 1.0): {sentiment['sentimentScore']}
    - Demand Score (1 to 10): {sentiment['demandScore']}
    - Trend: {sentiment['trendSummary']}
    
    HISTORICAL PRICING CASINGS (MEMORY):
    {memories_str or "No historical dynamic pricing runs cached."}
    INSTRUCTIONS:
    - Base your recommendation on competitor prices, cost price, sentiment, and memory.
    - Provide a pricing recommendation that optimizes revenue and volume.
    - Also perform a Chameleon Listing Optimization: read the competitor sentiment trend description. If there are complaints about competitor product flaws (e.g. fragile build, high sugar, short straps), rewrite our product name and description to highlight how our product solves that flaw. If there are no complaints, return our original name and description.
    
    Respond ONLY with a JSON object of this structure:
    {
        "price": <float representing recommended price>,
        "confidence": <float between 0.0 and 1.0 representing pricing confidence>,
        "reasoning": "<1-2 sentence explanation of your decision>",
        "chameleon_name": "<the optimized product title, or original name if no change>",
        "chameleon_description": "<the optimized product description, or original description if no change>"
    }
    Do not add markdown formatting, code blocks, or text outside the JSON.
    """

    if not GEMINI_API_KEY:
        # Fallback simulator
        import random
        old_price = product_info['sellingPrice']
        cost = product_info['costPrice']
        
        # Simple recommendation engine: match lowest competitor price plus a 5% margin, but not below cost
        comp_prices = [c['lastScrapedPrice'] for c in competitors if c.get('lastScrapedPrice') is not None]
        
        if comp_prices:
            min_comp = min(comp_prices)
            recommended = round(min_comp * 0.98, 2) # Undercut by 2%
        else:
            recommended = round(old_price * 1.02, 2) # Raise by 2% if no competitor
            
        # Bound it above cost
        recommended = max(recommended, round(cost * 1.25, 2))
        
        # Mock Chameleon Listing Optimization
        cham_name = product_info['name']
        cham_desc = product_info.get('description', '')
        if "Cookies" in product_info['name'] or "Cashew" in product_info['name']:
            cham_name = "Unibic Sugar Free Cashew Cookies (Firm Bake Crunch)"
            cham_desc = "Delightful sugar-free cashew cookies baked to hold their shape. Unlike fragile competitor cookies that crumble in transit, ours are baked with a proprietary moisture lock technique for a firm, satisfying crunch in every bite with zero glycemic impact."
        elif "Backpack" in product_info['name'].lower():
            cham_name = "Premium heavy-Duty Travel Backpack (Adjustable Straps)"
            cham_desc = "Made from water-resistant ripstop nylon. Unlike competitors with short straps that cause shoulder strain, our chameleon edition features extra-long, fully adjustable heavy-duty padded straps for all-day comfort."

        return {
            "price": recommended,
            "confidence": 0.85,
            "reasoning": f"Simulated recommendations: Undercutting competitor minimum while defending a 25% margin. Strong demand score ({sentiment['demandScore']}) justifies a slight premium.",
            "chameleon_name": cham_name,
            "chameleon_description": cham_desc
        }

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean JSON blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(text)
        return {
            "price": float(data.get("price", product_info['sellingPrice'])),
            "confidence": float(data.get("confidence", 0.8)),
            "reasoning": str(data.get("reasoning", "Stabilizing price to safeguard margins.")),
            "chameleon_name": str(data.get("chameleon_name", product_info['name'])),
            "chameleon_description": str(data.get("chameleon_description", product_info.get('description', '')))
        }
    except Exception as e:
        print(f"[Gemini Client] Pricing API call error: {e}. Falling back...")
        return {
            "price": product_info['sellingPrice'],
            "confidence": 0.7,
            "reasoning": "Fallback applied: retaining current price due to parsing exception.",
            "chameleon_name": product_info['name'],
            "chameleon_description": product_info.get('description', '')
        }
