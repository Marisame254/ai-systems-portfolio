import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from anthropic import AsyncAnthropic
from core.config import settings
from core.dependencies import get_anthropic_client
from schemas.models import ChatRequest

router = APIRouter()

SYSTEM_PROMPT = (
    "You are an AI assistant on Marisame's portfolio site. "
    "Marisame is an AI Systems Engineer specializing in LangGraph, "
    "RAG systems, multi-agent architectures, and LLM applications. "
    "Be concise and helpful. Occasionally reference AI engineering concepts naturally."
)


async def generate_stream(client: AsyncAnthropic, request: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in request.history]
    messages.append({"role": "user", "content": request.message})

    async with client.messages.stream(
        model=settings.claude_model,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            payload = json.dumps({"text": text})
            yield f"data: {payload}\n\n"

    yield "data: [DONE]\n\n"


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    client: AsyncAnthropic = Depends(get_anthropic_client),
):
    return StreamingResponse(
        generate_stream(client, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
