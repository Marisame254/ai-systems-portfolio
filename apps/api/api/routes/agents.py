from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

from agents.chat_agent import SYSTEM_PROMPT
from agents.serialize import serialize_state
from agents.tools import build_tools
from core.config import settings
from core.dependencies import get_chat_agent
from services.threads import delete_thread_row, list_threads_by_ids

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
            "description": "Graph terminal node. Returns the final messages list to the caller."
        }
    if node_id == "tools":
        return {
            "tools": [
                {"name": t.name, "description": (t.description or "").strip()}
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
async def get_graph(agent: CompiledStateGraph = Depends(get_chat_agent)):
    graph = agent.get_graph()

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


class ThreadIdsBody(BaseModel):
    thread_ids: list[str] = []


@router.post("/threads/list")
async def threads_list(body: ThreadIdsBody, http_request: Request):
    pool = http_request.app.state.checkpoint_pool
    return await list_threads_by_ids(pool, body.thread_ids)


@router.delete("/threads/{thread_id}")
async def threads_delete(
    thread_id: str,
    http_request: Request,
    agent: CompiledStateGraph = Depends(get_chat_agent),
):
    pool = http_request.app.state.checkpoint_pool
    # langgraph 1.x: adelete_thread on the checkpointer
    checkpointer = agent.checkpointer
    if checkpointer is not None:
        try:
            await checkpointer.adelete_thread(thread_id)
        except AttributeError:
            # older variants may use .delete_thread
            pass
    await delete_thread_row(pool, thread_id)
    return {"ok": True}


@router.get("/state/{thread_id}")
async def thread_state(
    thread_id: str,
    agent: CompiledStateGraph = Depends(get_chat_agent),
):
    config = {"configurable": {"thread_id": thread_id}}
    state = await agent.aget_state(config)
    if not state.values:
        raise HTTPException(status_code=404, detail="Thread not found or empty")
    return {"thread_id": thread_id, **serialize_state(state)}


@router.get("/state/{thread_id}/history")
async def thread_history(
    thread_id: str,
    agent: CompiledStateGraph = Depends(get_chat_agent),
):
    config = {"configurable": {"thread_id": thread_id}}
    snapshots = []
    async for snap in agent.aget_state_history(config):
        snapshots.append(serialize_state(snap))
    return {"thread_id": thread_id, "checkpoints": snapshots}
