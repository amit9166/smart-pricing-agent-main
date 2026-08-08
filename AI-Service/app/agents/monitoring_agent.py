import asyncio
from app.tools.mongodb import get_product, get_competitors_for_product, update_competitor_scraped_data, save_agent_log
from app.tools.playwright_scraper import scrape_competitor_site

async def monitoring_agent_node(state: dict) -> dict:
    product_id = state.get("product_id")
    run_id = state.get("run_id")
    logs = state.get("logs", [])
    
    print(f"[{run_id}] [Monitoring Agent] Starting scraping run for product: {product_id}")
    save_agent_log(run_id, product_id, "Monitoring Agent", "started", "Scraping competitor web links...", {})
    
    product_info = get_product(product_id)
    if not product_info:
        msg = f"Product {product_id} not found in MongoDB."
        logs.append(msg)
        save_agent_log(run_id, product_id, "Monitoring Agent", "failed", msg, {})
        return {"status": "failed", "logs": logs}
        
    competitors = get_competitors_for_product(product_id)
    scraped_competitors = []
    
    for comp in competitors:
        url = comp.get("url")
        comp_name = comp.get("name")
        comp_id = str(comp.get("_id"))
        
        # Scrape using browser automation
        result = await scrape_competitor_site(
            url, 
            selector_price=comp.get("selectorPrice"), 
            selector_stock=comp.get("selectorStock"),
            base_selling_price=product_info.get("sellingPrice")
        )
        
        # Save results directly in MongoDB
        update_competitor_scraped_data(
            comp_id,
            price=result["price"],
            stock=result["stock"],
            rating=result["rating"],
            discount=result["discount"]
        )
        
        scraped_competitors.append({
            "id": comp_id,
            "name": comp_name,
            "url": url,
            "lastScrapedPrice": result["price"],
            "lastScrapedStock": result["stock"],
            "lastScrapedRating": result["rating"],
            "lastScrapedDiscount": result["discount"]
        })
        
    logs.append(f"Scraped {len(scraped_competitors)} competitors.")
    save_agent_log(
        run_id, 
        product_id, 
        "Monitoring Agent", 
        "success", 
        f"Competitor data extracted and saved successfully for product: {product_info['name']}",
        {"scraped": scraped_competitors}
    )
    
    # We must convert MongoDB ObjectId types to strings for state compatibility
    product_info["_id"] = str(product_info["_id"])
    if "competitors" in product_info:
        product_info["competitors"] = [str(c) for c in product_info["competitors"]]
        
    return {
        "product_info": product_info,
        "competitors": scraped_competitors,
        "logs": logs
    }
