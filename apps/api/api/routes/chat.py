import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph.state import CompiledStateGraph

from agents.chat_agent import SYSTEM_PROMPT
from core.config import settings
from core.dependencies import get_chat_agent
from schemas.models import ChatRequest
from services.threads import upsert_thread

router = APIRouter()


@router.get("/info")
async def chat_info():
    if settings.environment == "prod":
        return {"provider": "openai", "model": settings.openai_model, "environment": "prod"}
    return {"provider": "ollama", "model": settings.ollama_model, "environment": "dev"}


TOOL_RESULT_PREVIEW_CHARS = 500
TITLE_MAX_CHARS = 60


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def generate_stream(
    agent: CompiledStateGraph,
    pool,
    request: ChatRequest,
):
    config = {
        "configurable": {"thread_id": request.thread_id},
        "recursion_limit": settings.agent_max_iterations * 2 + 2,
    }

    # Decide whether this is a new thread (no prior state) or a continuation.
    state = await agent.aget_state(config)
    is_new = not (state.values and state.values.get("messages"))

    if is_new:
        new_messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=request.message)]
        title = request.message[:TITLE_MAX_CHARS]
    else:
        new_messages = [HumanMessage(content=request.message)]
        title = None

    async for event in agent.astream_events(
        {"messages": new_messages},
        config=config,
        version="v2",
    ):
        kind = event["event"]

        if kind == "on_chat_model_stream":
            chunk = event["data"].get("chunk")
            text = getattr(chunk, "content", "") if chunk else ""
            if text:
                yield _sse({"type": "token", "text": text})

        elif kind == "on_tool_start":
            yield _sse(
                {
                    "type": "tool_call",
                    "name": event.get("name", ""),
                    "args": event["data"].get("input", {}),
                }
            )

        elif kind == "on_tool_end":
            output = event["data"].get("output")
            result_str = str(output) if output is not None else ""
            if len(result_str) > TOOL_RESULT_PREVIEW_CHARS:
                result_str = result_str[:TOOL_RESULT_PREVIEW_CHARS] + "..."
            yield _sse(
                {
                    "type": "tool_result",
                    "name": event.get("name", ""),
                    "result": result_str,
                }
            )

    await upsert_thread(pool, request.thread_id, title=title)
    yield "data: [DONE]\n\n"


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    http_request: Request,
    agent: CompiledStateGraph = Depends(get_chat_agent),
):
    pool = http_request.app.state.checkpoint_pool
    return StreamingResponse(
        generate_stream(agent, pool, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
