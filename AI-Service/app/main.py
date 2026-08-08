import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Load env values
from dotenv import load_dotenv
load_dotenv()

# Import graph runner
from app.graph.pricing_graph import run_pricing_agent_flow
from app.tools.playwright_scraper import scrape_competitor_site
from app.tools.chroma_memory import collection as chroma_coll
from app.tools.mongodb import (
    get_all_active_products,
    get_product,
    get_competitors_for_product,
    db,
    save_agent_log
)
from app.agents.discovery_agent import discover_competitors

app = FastAPI(
    title="Autonomous Dynamic Pricing Agent Service",
    description="Python FastAPI service running LangGraph agents, Playwright scrapers, and ChromaDB memory.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Request / Response Schemas
class RunAgentRequest(BaseModel):
    product_id: Optional[str] = None

class ScrapeRequest(BaseModel):
    url: str
    selector_price: Optional[str] = ""
    selector_stock: Optional[str] = ""

# Background runner task helper
async def run_flow_background(product_id: str):
    try:
        await run_pricing_agent_flow(product_id)
    except Exception as e:
        print(f"[FastAPI Server] Error in background agent run: {e}")

@app.post("/run-agent")
async def run_agent(payload: RunAgentRequest, background_tasks: BackgroundTasks):
    """
    Triggers the LangGraph agent dynamic pricing run for a product, or all products.
    """
    product_id = payload.product_id
    
    if product_id:
        # Verify product exists
        prod = get_product(product_id)
        if not prod:
            raise HTTPException(status_code=404, detail="Product not found")
        # Run asynchronously in background
        background_tasks.add_task(run_flow_background, product_id)
        return {"success": True, "message": f"Dynamic pricing run started for product {prod['name']}"}
    else:
        active_products = get_all_active_products()
        if not active_products:
            return {"success": True, "message": "No active products found to evaluate"}
        
        for prod in active_products:
            prod_id_str = str(prod["_id"])
            background_tasks.add_task(run_flow_background, prod_id_str)
            
        return {"success": True, "message": f"Dynamic pricing runs started for {len(active_products)} products"}

@app.post("/analyze-product")
async def analyze_product(payload: RunAgentRequest):
    """
    Triggers and returns the full graph flow details synchronously (blocking call for specific product analysis).
    """
    if not payload.product_id:
        raise HTTPException(status_code=400, detail="product_id is required")
        
    try:
        result = await run_pricing_agent_flow(payload.product_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape")
async def trigger_scrape(payload: ScrapeRequest):
    """
    Triggers the Playwright scraper directly on the provided URL.
    """
    try:
        result = await scrape_competitor_site(
            payload.url,
            selector_price=payload.selector_price,
            selector_stock=payload.selector_stock
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent-status")
async def get_agent_status():
    """
    Returns the current configuration, database, and vector memory statuses.
    """
    try:
        # Query count from ChromaDB collection
        memory_count = chroma_coll.count()
        
        # Test mongo connection
        mongo_ok = db.command("ping")
        
        return {
            "status": "online",
            "gemini_api_configured": os.getenv("GEMINI_API_KEY") is not None,
            "vector_memory_count": memory_count,
            "database_connected": mongo_ok.get("ok") == 1.0
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e)
        }

@app.get("/logs")
async def get_agent_logs(limit: int = 50):
    """
    Retrieves execution logs directly.
    """
    try:
        logs_cursor = db.agentlogs.find().sort("timestamp", -1).limit(limit)
        logs = []
        for log in logs_cursor:
            log["_id"] = str(log["_id"])
            if log.get("product"):
                log["product"] = str(log["product"])
            if log.get("timestamp"):
                log["timestamp"] = log["timestamp"].isoformat()
            logs.append(log)
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory")
async def get_vector_memory(product_id: Optional[str] = None):
    """
    Retrieves vector memories from ChromaDB.
    """
    try:
        # ChromaDB query filtering by metadata
        filter_dict = {}
        if product_id:
            filter_dict["product_id"] = product_id
            
        results = chroma_coll.get(
            where=filter_dict,
            limit=50
        )
        
        memories = []
        if results and results.get("ids"):
            for i in range(len(results["ids"])):
                memories.append({
                    "id": results["ids"][i],
                    "document": results["documents"][i],
                    "metadata": results["metadatas"][i]
                })
        return memories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DiscoverRequest(BaseModel):
    product_id: str

@app.post("/discover-competitors")
async def api_discover_competitors(payload: DiscoverRequest):
    """
    Finds competitor links for a product using Gemini or mock e-commerce search.
    """
    prod = get_product(payload.product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    try:
        discovered = discover_competitors(prod["name"])
        return {"success": True, "discovered": discovered}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Autonomous Dynamic Pricing Agent Service is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
