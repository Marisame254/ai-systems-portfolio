import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph.state import CompiledStateGraph

from agents.chat_agent import SYSTEM_PROMPT, get_chat_agent
from core.config import settings
from schemas.models import ChatRequest

router = APIRouter()


@router.get("/info")
async def chat_info():
    if settings.environment == "prod":
        return {"provider": "openai", "model": settings.openai_model, "environment": "prod"}
    return {"provider": "ollama", "model": settings.ollama_model, "environment": "dev"}


ROLE_TO_MSG = {"user": HumanMessage, "assistant": AIMessage}

TOOL_RESULT_PREVIEW_CHARS = 500


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def generate_stream(agent: CompiledStateGraph, request: ChatRequest):
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    messages.extend(ROLE_TO_MSG[m.role](content=m.content) for m in request.history)
    messages.append(HumanMessage(content=request.message))

    config = {"recursion_limit": settings.agent_max_iterations * 2 + 2}

    async for event in agent.astream_events(
        {"messages": messages},
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

    yield "data: [DONE]\n\n"


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    agent: CompiledStateGraph = Depends(get_chat_agent),
):
    return StreamingResponse(
        generate_stream(agent, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
