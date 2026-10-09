from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from langgraph.graph import END, START
from langgraph.graph.state import CompiledStateGraph

from agents.chat_agent import SYSTEM_PROMPT
from agents.serialize import serialize_state
from agents.tools import DOCUMENT_TOOL_NAME
from core.config import settings
from core.dependencies import get_chat_agent
from schemas.models import ThreadIdsRequest
from services.threads import delete_thread_row, list_threads_by_ids

router = APIRouter()


_NODE_TYPES = {
    "__start__": "start",
    "__end__": "end",
    "guardrail": "guard",
    "refuse": "guard",
    "load_memory": "memory",
    "save_memory": "memory",
    "summarize": "memory",
    "agent": "llm",
    "tools": "tool",
    "retrieve": "rag",
    "grade_documents": "rag",
    "rewrite_query": "rag",
    "return_documents": "rag",
}

_NODE_DESCRIPTIONS = {
    "__start__": "Graph entry point. Receives the new user message for the thread.",
    "__end__": "Graph terminal node. The turn is over and the state is checkpointed.",
    "guardrail": (
        "Screens the incoming message with a short LLM call before anything else runs: "
        "attempts to extract or override the system prompt, harmful requests and spam are "
        "routed to refuse; everything else continues. Fails open if the classifier errors."
    ),
    "refuse": (
        "Writes a brief refusal in the user's language and ends the turn. The agent, its tools "
        "and the memory nodes never run for a blocked message."
    ),
    "load_memory": (
        "Semantic search over the LangGraph Store (namespace=('memories', user_id)) "
        "using the user's latest message; the closest facts are injected as a system "
        "message so the agent can personalize replies."
    ),
    "save_memory": (
        "After the agent's final answer, calls the LLM to extract durable user facts "
        "and persists them to the Store. Skipped if no user_id is configured."
    ),
    "summarize": (
        f"Runs alongside save_memory once a thread has more than "
        f"{settings.summary_trigger_messages} unsummarized messages: folds the older turns into "
        f"a rolling summary kept in state. From then on the agent is sent the summary plus the "
        f"last {settings.summary_keep_turns} user turns; no message is deleted from the thread."
    ),
    "retrieve": (
        "Runs the search_user_documents tool: pgvector similarity search over the user's "
        "uploaded documents, filtered by user_id and a minimum similarity."
    ),
    "grade_documents": (
        "An LLM call judges each retrieved chunk against the question and keeps only the ones "
        "that help answer it. If none survive, the conditional edge goes to rewrite_query."
    ),
    "rewrite_query": (
        f"Rewrites the search query with different wording and loops back to retrieve "
        f"(at most {settings.rag_max_rewrites} rewrite per search)."
    ),
    "return_documents": (
        "Packs the chunks that passed grading into the ToolMessage the agent is waiting for, "
        "or reports that nothing relevant was found."
    ),
}


def _node_meta(name: str, request: Request) -> dict[str, Any]:
    meta: dict[str, Any] = {}
    if name in _NODE_DESCRIPTIONS:
        meta["description"] = _NODE_DESCRIPTIONS[name]
    if name == "tools":
        # search_user_documents is bound to the model but answered by the document_search subgraph.
        meta["tools"] = [
            {"name": t.name, "description": (t.description or "").strip()}
            for t in getattr(request.app.state, "agent_tools", [])
            if t.name != DOCUMENT_TOOL_NAME
        ]
    if name == "agent":
        is_prod = settings.environment == "prod"
        meta.update(
            provider="openai" if is_prod else "ollama",
            model=settings.openai_model if is_prod else settings.ollama_model,
            system_prompt=SYSTEM_PROMPT,
        )
    return meta


@router.get("/graph")
async def get_graph(request: Request, agent: CompiledStateGraph = Depends(get_chat_agent)):
    # xray expands subgraphs: their nodes come back as "<subgraph>:<node>".
    graph = agent.get_graph(xray=True)

    edges = []
    for edge in graph.edges:
        item: dict[str, Any] = {"source": edge.source, "target": edge.target}
        if getattr(edge, "conditional", False):
            item["conditional"] = True
        # A branch label is the routing key; skip it when it only repeats the target's name.
        condition = getattr(edge, "data", None)
        if condition and str(condition) not in (END, edge.target):
            item["condition"] = str(condition)
        edges.append(item)

    # A subgraph's own entry point is not worth drawing: point its incoming edges at what follows.
    inner_starts = {n for n in graph.nodes if n.endswith(f":{START}")}
    for inner_start in inner_starts:
        first_nodes = [e["target"] for e in edges if e["source"] == inner_start]
        rewired = []
        for e in edges:
            if e["source"] == inner_start:
                continue
            if e["target"] == inner_start:
                rewired.extend({**e, "target": first} for first in first_nodes)
            else:
                rewired.append(e)
        edges = rewired

    nodes = []
    for node_id in graph.nodes:
        if node_id in inner_starts:
            continue
        group, _, name = node_id.rpartition(":")
        node: dict[str, Any] = {
            "id": node_id,
            "label": name,
            "type": _NODE_TYPES.get(name, "llm"),
            "meta": _node_meta(name, request),
        }
        if group:
            node["group"] = group
        nodes.append(node)

    return {"nodes": nodes, "edges": edges}


@router.post("/threads/list")
async def threads_list(body: ThreadIdsRequest, http_request: Request):
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


@router.get("/state/{thread_id}/checkpoint/{checkpoint_id}")
async def thread_state_at_checkpoint(
    thread_id: str,
    checkpoint_id: str,
    agent: CompiledStateGraph = Depends(get_chat_agent),
):
    config = {"configurable": {"thread_id": thread_id, "checkpoint_id": checkpoint_id}}
    state = await agent.aget_state(config)
    if not state.values:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    return {"thread_id": thread_id, **serialize_state(state)}
