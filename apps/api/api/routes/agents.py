from fastapi import APIRouter

from agents.chat_agent import get_chat_agent

router = APIRouter()


_SPECIAL_NODES = {
    "__start__": "start",
    "__end__": "end",
    "tools": "tool",
}


def _classify(node_id: str) -> str:
    return _SPECIAL_NODES.get(node_id, "llm")


@router.get("/graph")
async def get_graph():
    graph = get_chat_agent().get_graph()

    nodes = [
        {"id": node_id, "label": node_id, "type": _classify(node_id)}
        for node_id in graph.nodes
    ]

    edges = []
    for edge in graph.edges:
        item = {"source": edge.source, "target": edge.target}
        if getattr(edge, "conditional", False):
            item["conditional"] = True
        if getattr(edge, "data", None):
            item["condition"] = str(edge.data)
        edges.append(item)

    return {"nodes": nodes, "edges": edges}
