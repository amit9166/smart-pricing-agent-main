from app.tools.mongodb import update_product_details, save_price_history, save_agent_log
from app.tools.chroma_memory import add_decision_memory
from app.tools.slack_client import send_slack_alert, send_anti_dumping_alert

async def execution_agent_node(state: dict) -> dict:
    product_info = state.get("product_info")
    product_id = state.get("product_id")
    run_id = state.get("run_id")
    final_price = state.get("final_price")
    rule_applied = state.get("rule_applied")
    gemini_rec = state.get("gemini_recommendation", {})
    sentiment = state.get("sentiment", {})
    competitors = state.get("competitors", [])
    logs = state.get("logs", [])
    
    if not product_info or not final_price:
        return state
        
    print(f"[{run_id}] [Execution Agent] Executing updates...")
    old_price = product_info["sellingPrice"]
    inventory = product_info.get("currentInventory", 0)
    
    # 1. Feature 4: Anti-Dumping Slack Alert Handler
    anti_dumping_alert = state.get("anti_dumping_alert")
    if anti_dumping_alert and anti_dumping_alert.get("triggered"):
        save_agent_log(run_id, product_id, "Execution Agent", "success", "Price war warning: anti-dumping alert triggered. Price frozen.", {})
        
        # Save history log with freeze pricing
        save_price_history(
            product_id,
            old_price=old_price,
            new_price=old_price,
            reason=anti_dumping_alert["recommendation"],
            confidence=1.0,
            agent_decision=True,
            rule_applied=rule_applied
        )
        
        # Dispatch emergency Slack webhook alert
        send_anti_dumping_alert(
            product_name=product_info["name"],
            sku=product_info["sku"],
            current_price=old_price,
            competitor_name=anti_dumping_alert["competitor_name"],
            competitor_price=anti_dumping_alert["competitor_price"],
            margin_impact=anti_dumping_alert["margin_impact"],
            recommendation=anti_dumping_alert["recommendation"]
        )
        
        logs.append("Price frozen due to competitor price war. Alert dispatched to Slack.")
        return {
            "status": "completed",
            "logs": logs
        }
    
    save_agent_log(run_id, product_id, "Execution Agent", "started", "Applying updates to MongoDB database...", {})
    
    # 2. Compute Dynamic Badges & Tags
    new_badges = list(product_info.get("badges", []))
    new_tags = list(product_info.get("tags", []))
    
    # Clean old auto-generated badges
    auto_badges = ["Trending Product", "Limited Stock", "Best Value", "Chameleon Optimized"]
    new_badges = [b for b in new_badges if b not in auto_badges]
    
    # Badge: Trending Product (if demand score is high)
    demand_score = sentiment.get("demandScore", 5)
    if demand_score >= 8:
        new_badges.append("Trending Product")
        if "Trending" not in new_tags:
            new_tags.append("Trending")
            
    # Badge: Limited Stock (if inventory is low and demand is decent)
    if inventory < 10 and demand_score >= 6:
        new_badges.append("Limited Stock")
        if "Low Stock" not in new_tags:
            new_tags.append("Low Stock")
            
    # Badge: Best Value (if our price is lower than the lowest competitor price)
    comp_prices = [c["lastScrapedPrice"] for c in competitors if c.get("lastScrapedPrice") is not None]
    if comp_prices:
        min_comp_price = min(comp_prices)
        if final_price < min_comp_price:
            new_badges.append("Best Value")
            if "Best Seller" not in new_tags:
                new_tags.append("Best Seller")
                
    # 3. Apply Chameleon optimized title/description
    chameleon = state.get("chameleon_optimized")
    updated_name = None
    updated_desc = None
    
    if chameleon and chameleon.get("applied"):
        new_badges.append("Chameleon Optimized")
        updated_name = chameleon.get("name")
        updated_desc = chameleon.get("description")
        logs.append(f"Applying AI Chameleon Optimization: Title='{updated_name}'")
        
    # Update database product record
    update_product_details(
        product_id, 
        final_price, 
        tags=new_tags, 
        badges=new_badges,
        name=updated_name,
        description=updated_desc
    )
    
    # 4. Log to PriceHistory table
    save_price_history(
        product_id,
        old_price=old_price,
        new_price=final_price,
        reason=gemini_rec.get("reasoning", "Autonomous price optimization"),
        confidence=gemini_rec.get("confidence", 1.0),
        agent_decision=True,
        rule_applied=rule_applied
    )
    
    # 5. Save decision to ChromaDB Memory
    decision_id = f"dec-{product_id}-{run_id}"
    description_doc = f"SKU: {product_info['sku']} price updated from ${old_price} to ${final_price} due to '{rule_applied}'. Reason: {gemini_rec.get('reasoning')}"
    metadata_mem = {
        "sku": product_info["sku"],
        "old_price": old_price,
        "new_price": final_price,
        "rule_applied": rule_applied,
        "confidence": gemini_rec.get("confidence", 1.0)
    }
    add_decision_memory(decision_id, product_id, description_doc, metadata_mem)
    
    # 6. Dispatch standard pricing Slack alert notification
    send_slack_alert(
        product_name=updated_name or product_info["name"],
        sku=product_info["sku"],
        old_price=old_price,
        new_price=final_price,
        reason=gemini_rec.get("reasoning", "Autonomous pricing optimization"),
        confidence=gemini_rec.get("confidence", 1.0),
        rule_applied=rule_applied
    )
    
    logs.append(f"Product updated successfully: Badges={new_badges}, Tags={new_tags}")
    save_agent_log(
        run_id,
        product_id,
        "Execution Agent",
        "success",
        f"Dynamic price applied successfully. Badges updated: {new_badges}.",
        {"badges": new_badges, "tags": new_tags}
    )
    
    return {
        "status": "completed",
        "logs": logs
    }
