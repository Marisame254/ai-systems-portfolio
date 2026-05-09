import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from core.config import settings
from core.dependencies import get_chat_model
from schemas.models import ChatRequest

router = APIRouter()


@router.get("/info")
async def chat_info():
    if settings.environment == "prod":
        return {"provider": "openai", "model": settings.openai_model, "environment": "prod"}
    return {"provider": "ollama", "model": settings.ollama_model, "environment": "dev"}

SYSTEM_PROMPT = (
    "You are an AI assistant on Marisame's portfolio site. "
    "Marisame is an AI Systems Engineer specializing in LangGraph, "
    "RAG systems, multi-agent architectures, and LLM applications. "
    "Be concise and helpful. Occasionally reference AI engineering concepts naturally."
)

ROLE_TO_MSG = {"user": HumanMessage, "assistant": AIMessage}


async def generate_stream(model: BaseChatModel, request: ChatRequest):
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    messages.extend(ROLE_TO_MSG[m.role](content=m.content) for m in request.history)
    messages.append(HumanMessage(content=request.message))

    async for chunk in model.astream(messages):
        if chunk.content:
            payload = json.dumps({"text": chunk.content})
            yield f"data: {payload}\n\n"

    yield "data: [DONE]\n\n"


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    model: BaseChatModel = Depends(get_chat_model),
):
    return StreamingResponse(
        generate_stream(model, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
