import json

SSE_DONE = "data: [DONE]\n\n"

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
}


def sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"
