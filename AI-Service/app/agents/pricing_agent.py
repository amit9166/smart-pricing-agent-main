from app.tools.mongodb import save_agent_log
from app.tools.gemini_client import generate_pricing_recommendation

from app.tools.mongodb import save_agent_log
from app.tools.gemini_client import generate_pricing_recommendation
from datetime import datetime

async def pricing_agent_node(state: dict) -> dict:
    product_info = state.get("product_info")
    product_id = state.get("product_id")
    run_id = state.get("run_id")
    competitors = state.get("competitors", [])
    sentiment = state.get("sentiment", {})
    similar_cases = state.get("similar_cases", [])
    logs = state.get("logs", [])
    
    if not product_info:
        return state
        
    print(f"[{run_id}] [Pricing Agent] Formulating pricing recommendation...")
    save_agent_log(run_id, product_id, "Pricing Agent", "started", "Running LLM analysis and applying boundary safety rules...", {})
    
    cost_price = product_info["costPrice"]
    current_price = product_info["sellingPrice"]
    
    # Extract Boundary Settings (Deterministic Guardrails)
    min_margin = product_info.get("minMarginPercent", 15)
    max_increase = product_info.get("maxPriceIncreasePercent", 10)
    max_decrease = product_info.get("maxPriceDecreasePercent", 15)
    
    # 1. Feature 4: Anti-Dumping Price War Alarm
    anti_dumping_triggered = False
    dumping_competitor = None
    dumping_price = 0.0
    
    for c in competitors:
        comp_price = c.get("lastScrapedPrice")
        if comp_price is not None and comp_price <= (current_price * 0.60):
            # Competitor dropped price by 40% or more!
            anti_dumping_triggered = True
            dumping_competitor = c.get("name", "Unknown Competitor")
            dumping_price = comp_price
            break
            
    if anti_dumping_triggered:
        margin_impact = ((dumping_price - cost_price) / dumping_price) * 100.0 if dumping_price > 0 else -100.0
        recommendation_report = (
            f"Competitor {dumping_competitor} slashes price to ${dumping_price:.2f}. "
            f"Matching this results in an unsustainable margin of {margin_impact:.1f}%. "
            f"AI Recommendation: Maintain current price at ${current_price:.2f} but increase marketing budget to highlight product features and durability."
        )
        
        logs.append(f"🚨 ANTI-DUMPING WARNING: Price war detected by competitor {dumping_competitor}. Price update frozen at ${current_price:.2f}.")
        save_agent_log(
            run_id,
            product_id,
            "Pricing Agent",
            "failed",
            f"🚨 Anti-Dumping Alarm: Competitor {dumping_competitor} dumped price to ${dumping_price:.2f}. Automated price changes paused.",
            {
                "competitor": dumping_competitor,
                "price": dumping_price,
                "margin_impact": margin_impact,
                "recommendation": recommendation_report
            }
        )
        
        state["final_price"] = current_price
        state["rule_applied"] = "Safety Rule: Anti-Dumping Price Freeze"
        state["anti_dumping_alert"] = {
            "triggered": True,
            "competitor_name": dumping_competitor,
            "competitor_price": dumping_price,
            "margin_impact": margin_impact,
            "recommendation": recommendation_report
        }
        state["logs"] = logs
        return state

    # 2. Filter out extreme competitor prices: ignore price if < 50% or > 200% of our cost price
    valid_competitors = []
    ignored_competitors = []
    for c in competitors:
        price = c.get("lastScrapedPrice")
        if price is not None:
            if price < (cost_price * 0.5) or price > (cost_price * 2.0):
                ignored_competitors.append(c)
            else:
                valid_competitors.append(c)
                
    if ignored_competitors:
        logs.append(f"Ignored extreme competitor prices: {[c['name'] for c in ignored_competitors]}")
        
    # 3. Get recommendation from Gemini (including Chameleon Description rewrites)
    gemini_res = generate_pricing_recommendation(
        product_info=product_info,
        competitors=valid_competitors,
        memories=similar_cases,
        sentiment=sentiment
    )
    
    recommended_price = gemini_res["price"]
    confidence = gemini_res["confidence"]
    reasoning = gemini_res["reasoning"]
    
    # 4. Feature 2: Urgency & Liquidator Pricing
    rule_applied = "Gemini AI Optimized"
    
    # Scenario A: Competitor Stockout Monopoly Boost
    competitors_scraped = [c for c in valid_competitors if c.get("lastScrapedStock") is not None]
    if competitors_scraped and all(c.get("lastScrapedStock") == "Out of Stock" for c in competitors_scraped):
        recommended_price = recommended_price * 1.10
        rule_applied = "Hype Rule: Competitor Stockout Monopoly Boost"
        logs.append("All active competitors are Out of Stock. Applied 10% Monopoly price boost.")
        
    # Scenario B: Dead Stock Liquidator
    is_dead_stock = False
    created_at_str = product_info.get("createdAt")
    if created_at_str:
        try:
            created_at = datetime.fromisoformat(str(created_at_str).replace("Z", "+00:00"))
            diff_days = (datetime.utcnow() - created_at.replace(tzinfo=None)).days
            if diff_days >= 30:
                is_dead_stock = True
        except Exception:
            pass
            
    # Mocking high inventory as dead stock trigger for testing
    if product_info.get("currentInventory", 0) > 80:
        is_dead_stock = True
        
    if is_dead_stock and rule_applied == "Gemini AI Optimized":
        recommended_price = recommended_price * 0.95
        rule_applied = "Dead Stock Liquidator Discount"
        logs.append("Product classified as Dead Stock. Applied incremental 5% liquidation discount.")

    # 5. Apply Deterministic Margin Guardrails
    final_price = recommended_price
    
    # Guardrail A: Never below cost price
    if final_price < cost_price:
        final_price = cost_price
        rule_applied = "Floor Rule: Cost Price Protection"
        logs.append(f"Adjusted recommended price ${recommended_price:.2f} up to Cost Price floor ${cost_price:.2f}")
        
    # Guardrail B: Minimum Profit Margin Guardrail
    min_price_with_margin = cost_price * (1 + (min_margin / 100.0))
    if final_price < min_price_with_margin:
        final_price = min_price_with_margin
        rule_applied = f"Margin Rule: Minimum {min_margin}% Margin Protection"
        logs.append(f"Adjusted recommended price to {min_margin}% margin floor: ${min_price_with_margin:.2f}")

    # Guardrail C: Maximum Spike Increase
    max_allowed_price = current_price * (1 + (max_increase / 100.0))
    if final_price > max_allowed_price:
        final_price = max_allowed_price
        rule_applied = f"Ceiling Rule: Max {max_increase}% Increase Restriction"
        logs.append(f"Adjusted recommended price to max increase ceiling: ${max_allowed_price:.2f}")
        
    # Guardrail D: Maximum Discount Spike Drop
    min_allowed_price = current_price * (1 - (max_decrease / 100.0))
    if final_price < min_allowed_price:
        # Prioritize margin protection over discount restriction
        final_price = max(min_allowed_price, min_price_with_margin)
        if final_price == min_allowed_price:
            rule_applied = f"Discount Rule: Max {max_decrease}% Discount Restriction"
            logs.append(f"Adjusted recommended price to max discount floor: ${min_allowed_price:.2f}")
            
    final_price = round(final_price, 2)
    
    logs.append(f"Pricing evaluation complete. Recommended: ${recommended_price:.2f}, Final: ${final_price:.2f} (Rule: {rule_applied})")
    
    save_agent_log(
        run_id,
        product_id,
        "Pricing Agent",
        "success",
        f"Proposed final price: ${final_price} (Applied Rule: {rule_applied}). Confidence: {confidence}",
        {
            "gemini_recommendation": gemini_res,
            "final_price": final_price,
            "rule_applied": rule_applied
        }
    )
    
    # Save Chameleon listings optimization details in state if optimized
    chameleon_optimized = None
    if gemini_res.get("chameleon_name") != product_info["name"] or gemini_res.get("chameleon_description") != product_info.get("description", ""):
        chameleon_optimized = {
            "name": gemini_res.get("chameleon_name"),
            "description": gemini_res.get("chameleon_description"),
            "applied": True
        }
        logs.append("Listing optimization: Chameleon title or description rewrite triggered.")
    
    return {
        "gemini_recommendation": gemini_res,
        "final_price": final_price,
        "rule_applied": rule_applied,
        "chameleon_optimized": chameleon_optimized,
        "logs": logs
    }
