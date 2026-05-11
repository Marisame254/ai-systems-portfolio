from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from langgraph.store.base import BaseStore

from schemas.models import MemoryEntry


def _namespace(user_id: str) -> tuple[str, str]:
    return ("memories", user_id)


def _to_entry(item: Any) -> MemoryEntry:
    value = item.value or {}
    text = value.get("text", "") if isinstance(value, dict) else str(value)
    source = value.get("source", "manual") if isinstance(value, dict) else "manual"
    created_at = value.get("created_at") if isinstance(value, dict) else None
    if not created_at:
        created_at = (
            item.created_at.isoformat()
            if getattr(item, "created_at", None)
            else datetime.now(timezone.utc).isoformat()
        )
    return MemoryEntry(
        key=item.key,
        text=text,
        source=source if source in ("auto", "manual") else "manual",
        created_at=created_at,
    )


async def list_memories(store: BaseStore, user_id: str) -> list[MemoryEntry]:
    items = await store.asearch(_namespace(user_id), limit=100)
    entries = [_to_entry(i) for i in items]
    entries.sort(key=lambda e: e.created_at, reverse=True)
    return entries


async def add_memory(
    store: BaseStore,
    user_id: str,
    text: str,
    *,
    source: str = "manual",
) -> MemoryEntry:
    key = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    value = {"text": text, "source": source, "created_at": created_at}
    await store.aput(_namespace(user_id), key, value)
    return MemoryEntry(key=key, text=text, source=source, created_at=created_at)


async def delete_memory(store: BaseStore, user_id: str, key: str) -> None:
    await store.adelete(_namespace(user_id), key)


async def clear_memories(store: BaseStore, user_id: str) -> int:
    ns = _namespace(user_id)
    items = await store.asearch(ns, limit=1000)
    for item in items:
        await store.adelete(ns, item.key)
    return len(items)
