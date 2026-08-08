import os
import requests
import json

def send_slack_alert(product_name: str, sku: str, old_price: float, new_price: float, reason: str, confidence: float, rule_applied: str):
    """
    Dispatches a standard dynamic pricing update notification to Slack.
    """
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook_url:
        print(f"[Slack Mock Alert] Dynamic price updated for {product_name} ({sku}): ${old_price:.2f} -> ${new_price:.2f} (Applied Rule: {rule_applied})")
        return
        
    change_percent = ((new_price - old_price) / old_price) * 100.0 if old_price > 0 else 0.0
    direction = "📈 Increased" if new_price >= old_price else "📉 Decreased"
    color = "#10b981" if new_price >= old_price else "#ef4444"

    payload = {
        "text": f"🔔 *Dynamic Pricing Alert:* Product price updated dynamically by AI Agent.",
        "attachments": [
            {
                "color": color,
                "fields": [
                    { "title": "Product Name", "value": product_name, "short": True },
                    { "title": "SKU Code", "value": sku, "short": True },
                    { "title": "Old Price", "value": f"${old_price:.2f}", "short": True },
                    { "title": "New Price", "value": f"${new_price:.2f} ({direction} {change_percent:.1f}%)", "short": True },
                    { "title": "Safety Rule Applied", "value": rule_applied, "short": True },
                    { "title": "AI Confidence", "value": f"{int(confidence * 100)}%", "short": True },
                    { "title": "Reasoning Report", "value": reason, "short": False }
                ]
            }
        ]
    }
    
    try:
        requests.post(webhook_url, json=payload, headers={"Content-Type": "application/json"})
        print("[Slack Client] Alert sent successfully")
    except Exception as e:
        print(f"[Slack Client] Error sending webhook: {e}")

def send_anti_dumping_alert(product_name: str, sku: str, current_price: float, competitor_name: str, competitor_price: float, margin_impact: float, recommendation: str):
    """
    Dispatches an emergency alert notifying the merchant that a competitor has dumped prices.
    """
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook_url:
        print(f"[Slack Mock Anti-Dumping Alarm] Alert generated for {product_name} ({sku}): Competitor {competitor_name} dropped price to ${competitor_price:.2f}")
        return
        
    payload = {
        "text": f"🚨 *ANTI-DUMPING EMERGENCY ALARM:* Price-war activity detected!",
        "attachments": [
            {
                "color": "#e11d48", # Red
                "fields": [
                    { "title": "Product Name", "value": product_name, "short": True },
                    { "title": "SKU Code", "value": sku, "short": True },
                    { "title": "Our Current Price", "value": f"${current_price:.2f}", "short": True },
                    { "title": f"{competitor_name} Slashed Price", "value": f"${competitor_price:.2f} (🚨 Dropped by >= 40%!)", "short": True },
                    { "title": "Calculated Margin Impact", "value": f"Matching this price results in a profit margin of {margin_impact:.1f}% (REJECTED/UNSAFE)", "short": False },
                    { "title": "AI Recommendation & Strategy Report", "value": recommendation, "short": False }
                ]
            }
        ]
    }
    
    try:
        requests.post(webhook_url, json=payload, headers={"Content-Type": "application/json"})
        print("[Slack Client] Anti-dumping alert sent successfully")
    except Exception as e:
        print(f"[Slack Client] Error sending anti-dumping webhook: {e}")
