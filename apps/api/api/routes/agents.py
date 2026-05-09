from typing import Any

from fastapi import APIRouter

from agents.chat_agent import SYSTEM_PROMPT, get_chat_agent
from agents.tools import build_tools
from core.config import settings

router = APIRouter()


_SPECIAL_NODES = {
    "__start__": "start",
    "__end__": "end",
    "tools": "tool",
}


def _classify(node_id: str) -> str:
    return _SPECIAL_NODES.get(node_id, "llm")


def _node_meta(node_id: str) -> dict[str, Any]:
    if node_id == "__start__":
        return {
            "description": (
                "Graph entry point. Receives the initial state "
                "(list of messages: System + history + user input)."
            )
        }
    if node_id == "__end__":
        return {
            "description": (
                "Graph terminal node. Returns the final messages list to the caller."
            )
        }
    if node_id == "tools":
        return {
            "tools": [
                {
                    "name": t.name,
                    "description": (t.description or "").strip(),
                }
                for t in build_tools()
            ]
        }
    if node_id == "agent":
        is_prod = settings.environment == "prod"
        return {
            "provider": "openai" if is_prod else "ollama",
            "model": settings.openai_model if is_prod else settings.ollama_model,
            "system_prompt": SYSTEM_PROMPT,
        }
    return {}


@router.get("/graph")
async def get_graph():
    graph = get_chat_agent().get_graph()

    nodes = [
        {
            "id": node_id,
            "label": node_id,
            "type": _classify(node_id),
            "meta": _node_meta(node_id),
        }
        for node_id in graph.nodes
    ]

    edges = []
    for edge in graph.edges:
        item: dict[str, Any] = {"source": edge.source, "target": edge.target}
        if getattr(edge, "conditional", False):
            item["conditional"] = True
        if getattr(edge, "data", None):
            item["condition"] = str(edge.data)
        edges.append(item)

    return {"nodes": nodes, "edges": edges}
