import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from langgraph.store.base import BaseStore

from core.dependencies import get_memory_store
from core.rate_limit import rate_limit
from schemas.models import MemoryCreateRequest, MemoryEntry, MemoryListResponse
from services.memory import (
    MemoryLimitError,
    add_memory,
    clear_memories,
    delete_memory,
    list_memories,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{user_id}", response_model=MemoryListResponse)
async def get_memory(user_id: str, store: BaseStore = Depends(get_memory_store)):
    entries = await list_memories(store, user_id)
    return MemoryListResponse(user_id=user_id, entries=entries)


@router.post(
    "/{user_id}",
    response_model=MemoryEntry,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("memory_write", "rate_limit_memory_write"))],
)
async def create_memory(
    user_id: str,
    body: MemoryCreateRequest,
    store: BaseStore = Depends(get_memory_store),
):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must be non-empty")
    try:
        return await add_memory(store, user_id, text, source="manual")
    except MemoryLimitError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        # The store embeds the text on write, so an unreachable embeddings provider lands here.
        logger.exception("memory.create failed")
        raise HTTPException(
            status_code=503, detail="Could not save memory. Check the embeddings provider."
        ) from exc


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
