import os
import json
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def discover_competitors(product_name: str) -> list:
    """
    Queries Gemini to automatically discover top store links and price selectors
    for a product name. Falls back to simulator if API keys are missing.
    """
    prompt = f"""
    Identify 3 top real e-commerce stores (like Amazon, Walmart, Target, Flipkart, Pepperfry, etc.) that sell the following product:
    Product Name: "{product_name}"
    
    For each store, generate:
    1. Store Name (e.g. "Amazon")
    2. A highly realistic or actual product detail page URL on their site
    3. A standard CSS selector tag commonly used on their product detail pages to select the price element (e.g., '.a-price-whole' for Amazon, '.price' for others)
    
    Respond ONLY with a JSON list structure like this:
    [
        {{
            "name": "<Store Name>",
            "url": "<Store Product Detail Page URL>",
            "selectorPrice": "<CSS Selector Price Tag>"
        }}
    ]
    Do not add markdown, code blocks, or explanations outside the JSON.
    """

    if not GEMINI_API_KEY:
        # Fallback simulator based on product types
        print(f"[Discovery Agent] [Simulator Mode] Simulating e-commerce search for: {product_name}")
        
        # Determine product type
        name_lower = product_name.lower()
        query_encoded = product_name.replace(" ", "+")
        
        if "cookies" in name_lower or "cashew" in name_lower or "unibic" in name_lower:
            return [
                {
                    "name": "Amazon",
                    "url": "https://www.amazon.in/s?k=Unibic+Sugar+Free+Cashew+Cookies",
                    "selectorPrice": ".a-price-whole"
                },
                {
                    "name": "Flipkart",
                    "url": "https://www.flipkart.com/search?q=unibic+sugar+free+cashew+cookies+202.5g",
                    "selectorPrice": "._30jeq3"
                },
                {
                    "name": "Target",
                    "url": "https://www.target.com/s?searchTerm=unibic+sugar+free+cashew+cookies",
                    "selectorPrice": "[data-test='product-price']"
                }
            ]
        elif "chair" in name_lower or "ergo" in name_lower:
            return [
                {
                    "name": "Wakefit",
                    "url": "https://www.wakefit.co/office-chairs",
                    "selectorPrice": ".price"
                },
                {
                    "name": "Amazon",
                    "url": "https://www.amazon.in/s?k=Ergonomic+Office+Chair",
                    "selectorPrice": ".a-price-whole"
                },
                {
                    "name": "Pepperfry",
                    "url": "https://www.pepperfry.com/site_product/search?q=ergonomic+office+chair",
                    "selectorPrice": ".offer-price"
                }
            ]
        else:
            # Generic search fallback (will never 404!)
            return [
                {
                    "name": "Amazon",
                    "url": f"https://www.amazon.com/s?k={query_encoded}",
                    "selectorPrice": ".a-price-whole"
                },
                {
                    "name": "Walmart",
                    "url": f"https://www.walmart.com/search?q={query_encoded}",
                    "selectorPrice": "[data-testid='price-wrap']"
                },
                {
                    "name": "Target",
                    "url": f"https://www.target.com/s?searchTerm={query_encoded}",
                    "selectorPrice": "[data-test='product-price']"
                }
            ]

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown wrappers if LLM returned them
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(text)
        
        # Post-process generated links to prevent speculative 404s
        final_list = data if isinstance(data, list) else [data]
        query_encoded = product_name.replace(" ", "+")
        
        for item in final_list:
            url = item.get("url", "")
            # If the generated URL has a broken Amazon dp link or template parameter
            if "amazon" in url.lower():
                parts = url.split("/dp/")
                asin = parts[1].split("/")[0].split("?")[0].strip() if len(parts) > 1 else ""
                if len(asin) != 10 or not asin.isalnum():
                    # Rewrite to safe search URL
                    item["url"] = f"https://www.amazon.com/s?k={query_encoded}"
            elif "walmart" in url.lower() and ("/ip/" in url.lower() or "placeholder" in url.lower()):
                item["url"] = f"https://www.walmart.com/search?q={query_encoded}"
            elif "target" in url.lower() and ("/p/" in url.lower() or "placeholder" in url.lower()):
                item["url"] = f"https://www.target.com/s?searchTerm={query_encoded}"
                
        return final_list
    except Exception as e:
        print(f"[Discovery Agent] Gemini API call error: {e}. Falling back to default list.")
        return [
            {
                "name": "Amazon",
                "url": f"https://www.amazon.com/s?k={product_name.replace(' ', '+')}",
                "selectorPrice": ".a-price-whole"
            }
        ]
