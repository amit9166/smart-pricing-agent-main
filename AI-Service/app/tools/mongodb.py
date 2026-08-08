import os
from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/competitive_pricing")
client = MongoClient(MONGO_URI)
db = client.get_default_database()

def get_product(product_id: str):
    try:
        return db.products.find_one({"_id": ObjectId(product_id)})
    except Exception as e:
        print(f"[MongoDB Tool] Error getting product: {e}")
        return None

def get_all_active_products():
    try:
        return list(db.products.find({"status": "active"}))
    except Exception as e:
        print(f"[MongoDB Tool] Error listing products: {e}")
        return []

def update_product_price(product_id: str, new_price: float, tags: list = None, badges: list = None):
    try:
        update_doc = {"$set": {"sellingPrice": new_price}}
        if tags is not None:
            update_doc["$set"]["tags"] = tags
        if badges is not None:
            update_doc["$set"]["badges"] = badges
            
        db.products.update_one({"_id": ObjectId(product_id)}, update_doc)
        print(f"[MongoDB Tool] Updated product {product_id} price to ${new_price}")
        return True
    except Exception as e:
        print(f"[MongoDB Tool] Error updating product: {e}")
        return False

def update_product_details(product_id: str, new_price: float, tags: list = None, badges: list = None, name: str = None, description: str = None):
    try:
        update_doc = {"$set": {"sellingPrice": new_price}}
        if tags is not None:
            update_doc["$set"]["tags"] = tags
        if badges is not None:
            update_doc["$set"]["badges"] = badges
        if name is not None:
            update_doc["$set"]["name"] = name
        if description is not None:
            update_doc["$set"]["description"] = description
            
        db.products.update_one({"_id": ObjectId(product_id)}, update_doc)
        print(f"[MongoDB Tool] Updated product {product_id} details (price: ${new_price})")
        return True
    except Exception as e:
        print(f"[MongoDB Tool] Error updating product details: {e}")
        return False

def get_competitors_for_product(product_id: str):
    try:
        return list(db.competitors.find({"product": ObjectId(product_id)}))
    except Exception as e:
        print(f"[MongoDB Tool] Error getting competitors: {e}")
        return []

def update_competitor_scraped_data(competitor_id: str, price: float, stock: str, rating: float, discount: float):
    try:
        update_doc = {
            "$set": {
                "lastScrapedPrice": price,
                "lastScrapedStock": stock,
                "lastScrapedRating": rating,
                "lastScrapedDiscount": discount,
                "lastScrapedAt": datetime.utcnow()
            },
            "$push": {
                "history": {
                    "price": price,
                    "scrapedAt": datetime.utcnow()
                }
            }
        }
        db.competitors.update_one({"_id": ObjectId(competitor_id)}, update_doc)
        print(f"[MongoDB Tool] Updated competitor {competitor_id} with price ${price}")
        return True
    except Exception as e:
        print(f"[MongoDB Tool] Error updating competitor: {e}")
        return False

def save_price_history(product_id: str, old_price: float, new_price: float, reason: str, confidence: float, agent_decision: bool, rule_applied: str):
    try:
        history_doc = {
            "product": ObjectId(product_id),
            "oldPrice": old_price,
            "newPrice": new_price,
            "reason": reason,
            "confidence": confidence,
            "agentDecision": agent_decision,
            "ruleApplied": rule_applied,
            "timestamp": datetime.utcnow()
        }
        db.pricehistories.insert_one(history_doc)
        print(f"[MongoDB Tool] Logged price history for product {product_id}")
        return True
    except Exception as e:
        print(f"[MongoDB Tool] Error logging price history: {e}")
        return False

def save_agent_log(run_id: str, product_id: str, agent_name: str, status: str, message: str, payload: dict):
    try:
        log_doc = {
            "runId": run_id,
            "product": ObjectId(product_id) if product_id else None,
            "agentName": agent_name,
            "status": status,
            "message": message,
            "payload": payload,
            "timestamp": datetime.utcnow()
        }
        db.agentlogs.insert_one(log_doc)
        return True
    except Exception as e:
        print(f"[MongoDB Tool] Error saving agent log: {e}")
        return False

def save_sentiment(product_id: str, demand_score: int, sentiment_score: float, positive_count: int, negative_count: int, trend_summary: str):
    try:
        query = {"product": ObjectId(product_id)}
        sentiment_doc = {
            "product": ObjectId(product_id),
            "demandScore": demand_score,
            "sentimentScore": sentiment_score,
            "positiveSentimentCount": positive_count,
            "negativeSentimentCount": negative_count,
            "trendSummary": trend_summary,
            "source": "Reddit / Reviews",
            "lastUpdated": datetime.utcnow()
        }
        db.sentiments.update_one(query, {"$set": sentiment_doc}, upsert=True)
        print(f"[MongoDB Tool] Saved sentiment score for product {product_id}")
        return True
    except Exception as e:
        print(f"[MongoDB Tool] Error saving sentiment: {e}")
        return False
