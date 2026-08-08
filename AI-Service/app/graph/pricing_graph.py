import uuid
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

# Import agent nodes
from app.agents.monitoring_agent import monitoring_agent_node
from app.agents.sentiment_agent import sentiment_agent_node
from app.agents.memory_agent import memory_agent_node
from app.agents.pricing_agent import pricing_agent_node
from app.agents.execution_agent import execution_agent_node

# Define Graph State
class AgentState(TypedDict):
    run_id: str
    product_id: str
    product_info: Dict[str, Any]
    competitors: List[Dict[str, Any]]
    sentiment: Dict[str, Any]
    similar_cases: List[Dict[str, Any]]
    gemini_recommendation: Dict[str, Any]
    final_price: float
    rule_applied: str
    status: str
    logs: List[str]

# Create StateGraph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("monitoring_node", monitoring_agent_node)
workflow.add_node("sentiment_node", sentiment_agent_node)
workflow.add_node("memory_node", memory_agent_node)
workflow.add_node("pricing_node", pricing_agent_node)
workflow.add_node("execution_node", execution_agent_node)

# Set Entry Point
workflow.set_entry_point("monitoring_node")

# Define Edges
workflow.add_edge("monitoring_node", "sentiment_node")
workflow.add_edge("sentiment_node", "memory_node")
workflow.add_edge("memory_node", "pricing_node")
workflow.add_edge("pricing_node", "execution_node")
workflow.add_edge("execution_node", END)

# Compile Graph
pricing_graph = workflow.compile()

async def run_pricing_agent_flow(product_id: str) -> dict:
    """
    Orchestrates the entire pricing loop for a given product ID using LangGraph.
    """
    run_id = f"run-{uuid.uuid4().hex[:8]}"
    initial_state = {
        "run_id": run_id,
        "product_id": product_id,
        "product_info": {},
        "competitors": [],
        "sentiment": {},
        "similar_cases": [],
        "gemini_recommendation": {},
        "final_price": 0.0,
        "rule_applied": "None",
        "status": "started",
        "logs": []
    }
    
    print(f"[pricing_graph] Starting execution flow run_id: {run_id}")
    final_state = await pricing_graph.ainvoke(initial_state)
    return final_state
