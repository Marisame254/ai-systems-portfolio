import logging

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph.state import CompiledStateGraph

from agents.chat_agent import SYSTEM_PROMPT
from agents.llm import INTERNAL_TAG
from api.sse import SSE_DONE, SSE_HEADERS, sse_event
from core.config import settings
from core.dependencies import get_chat_agent
from core.rate_limit import rate_limit
from schemas.models import ChatRequest
from services.threads import upsert_thread

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/info")
async def chat_info():
    if settings.environment == "prod":
        return {"provider": "openai", "model": settings.openai_model, "environment": "prod"}
    return {"provider": "ollama", "model": settings.ollama_model, "environment": "dev"}


TOOL_RESULT_PREVIEW_CHARS = 500
TITLE_MAX_CHARS = 60

_traced_nodes_cache: dict[int, dict[str, str]] = {}


def traced_nodes(agent: CompiledStateGraph) -> dict[str, str]:
    """Node name as it appears in stream events -> id in the drawn graph (/api/agents/graph).

    These are the nodes surfaced to the client as `node` events. Subgraph nodes are drawn
    with their parent as a prefix ("document_search:retrieve") but emit events under the
    bare name, so node names must be unique across the graph and its subgraphs.
    """
    cached = _traced_nodes_cache.get(id(agent))
    if cached is None:
        cached = {}
        for node_id in agent.get_graph(xray=True).nodes:
            name = node_id.rsplit(":", 1)[-1]
            if not name.startswith("__"):
                cached[name] = node_id
        _traced_nodes_cache[id(agent)] = cached
    return cached


async def generate_stream(
    agent: CompiledStateGraph,
    pool,
    request: ChatRequest,
):
    configurable: dict = {"thread_id": request.thread_id}
    if request.user_id:
        configurable["user_id"] = request.user_id
    if request.checkpoint_id:
        configurable["checkpoint_id"] = request.checkpoint_id
    config = {
        "configurable": configurable,
        # guardrail + load_memory, then agent/tools per iteration, the final answer, and the
        # closing step (save_memory, summarize).
        "recursion_limit": settings.agent_max_iterations * 2 + 4,
    }

    logger.info(
        "chat.stream start thread=%s configurable_keys=%s has_user_id=%s has_checkpoint=%s",
        request.thread_id,
        list(configurable.keys()),
        bool(request.user_id),
        bool(request.checkpoint_id),
    )

    # Decide whether this is a new thread or a continuation.
    # When forking from a checkpoint the SystemMessage is already in that snapshot,
    # so we always treat it as a continuation.
    state = await agent.aget_state(config)
    is_new = not request.checkpoint_id and not (
        state.values and state.values.get("messages")
    )

    if is_new:
        new_messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=request.message)]
        title = request.message[:TITLE_MAX_CHARS]
    else:
        new_messages = [HumanMessage(content=request.message)]
        title = None

    # node name -> run_id of the run we reported as started. Runnables nested inside a node
    # can carry the node's name too; tracking the outer run_id keeps one start/end pair per visit.
    active_nodes: dict[str, str] = {}
    traced = traced_nodes(agent)

    try:
        async for event in agent.astream_events(
            {"messages": new_messages},
            config=config,
            version="v2",
        ):
            kind = event["event"]

            if kind == "on_chain_start":
                name = event.get("name", "")
                if (
                    name in traced
                    and (event.get("metadata") or {}).get("langgraph_node") == name
                    and name not in active_nodes
                ):
                    active_nodes[name] = event["run_id"]
                    yield sse_event({"type": "node", "name": traced[name], "status": "start"})

            elif kind == "on_chain_end":
                name = event.get("name", "")
                if active_nodes.get(name) == event["run_id"]:
                    del active_nodes[name]
                    yield sse_event({"type": "node", "name": traced[name], "status": "end"})

            elif kind == "on_chat_model_stream":
                if INTERNAL_TAG in (event.get("tags") or []):
                    continue
                chunk = event["data"].get("chunk")
                text = getattr(chunk, "content", "") if chunk else ""
                if text:
                    yield sse_event({"type": "token", "text": text})

            elif kind == "on_tool_start":
                yield sse_event(
                    {
                        "type": "tool_call",
                        "name": event.get("name", ""),
                        "args": event["data"].get("input", {}),
                    }
                )

            elif kind == "on_tool_end":
                output = event["data"].get("output")
                # Tools run from a tool call return a ToolMessage; show its text, not its repr.
                output = getattr(output, "content", output)
                result_str = str(output) if output is not None else ""
                if len(result_str) > TOOL_RESULT_PREVIEW_CHARS:
                    result_str = result_str[:TOOL_RESULT_PREVIEW_CHARS] + "..."
                yield sse_event(
                    {
                        "type": "tool_result",
                        "name": event.get("name", ""),
                        "result": result_str,
                    }
                )

        await upsert_thread(pool, request.thread_id, title=title)
    except Exception:
        logger.exception("chat.stream failed thread=%s", request.thread_id)
        yield sse_event(
            {"type": "error", "message": "El asistente falló al generar la respuesta."}
        )
    finally:
        yield SSE_DONE


@router.post("/stream", dependencies=[Depends(rate_limit("chat", "rate_limit_chat"))])
async def stream_chat(
    request: ChatRequest,
    http_request: Request,
    agent: CompiledStateGraph = Depends(get_chat_agent),
):
    pool = http_request.app.state.checkpoint_pool
    return StreamingResponse(
        generate_stream(agent, pool, request),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
