from fastapi import APIRouter, Depends, HTTPException, Response, status
from langgraph.store.base import BaseStore

from core.dependencies import get_memory_store
from schemas.models import MemoryCreateRequest, MemoryEntry, MemoryListResponse
from services.memory import add_memory, clear_memories, delete_memory, list_memories

router = APIRouter()


@router.get("/{user_id}", response_model=MemoryListResponse)
async def get_memory(user_id: str, store: BaseStore = Depends(get_memory_store)):
    entries = await list_memories(store, user_id)
    return MemoryListResponse(user_id=user_id, entries=entries)


@router.post("/{user_id}", response_model=MemoryEntry, status_code=status.HTTP_201_CREATED)
async def create_memory(
    user_id: str,
    body: MemoryCreateRequest,
    store: BaseStore = Depends(get_memory_store),
):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must be non-empty")
    return await add_memory(store, user_id, text, source="manual")


@router.delete("/{user_id}/{key}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_memory(
    user_id: str,
    key: str,
    store: BaseStore = Depends(get_memory_store),
):
    await delete_memory(store, user_id, key)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{user_id}")
async def clear_memory(user_id: str, store: BaseStore = Depends(get_memory_store)):
    deleted = await clear_memories(store, user_id)
    return {"user_id": user_id, "deleted": deleted}
