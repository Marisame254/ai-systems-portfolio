from fastapi import APIRouter

router = APIRouter()


@router.get("/{session_id}")
async def get_memory(session_id: str):
    return {
        "session_id": session_id,
        "entries": [],
        "summary": "No memory stored yet (demo mode — connect Redis to enable persistence)",
    }


@router.delete("/{session_id}")
async def clear_memory(session_id: str):
    return {"status": "cleared", "session_id": session_id}
