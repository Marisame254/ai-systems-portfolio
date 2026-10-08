from types import SimpleNamespace

import pytest

from agents.chat_agent import _parse_facts
from core.config import settings
from services.memory import MemoryLimitError, add_memory


class FakeStore:
    def __init__(self, existing: int = 0):
        self.items = [SimpleNamespace(key=str(i), value={"text": f"fact {i}"}) for i in range(existing)]
        self.puts: list[tuple] = []

    async def asearch(self, namespace, limit=10, **_):
        return self.items[:limit]

    async def aput(self, namespace, key, value):
        self.puts.append((namespace, key, value))


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ('["User name is Bob", "Prefers TS"]', ["User name is Bob", "Prefers TS"]),
        ('Sure! Here you go:\n["Lives in Oaxaca"]\nDone.', ["Lives in Oaxaca"]),
        ("[]", []),
        ("no json here", []),
        ('["ok", "", {"nested": 1}, 7]', ["ok", "7"]),
        ('{"not": "a list"}', []),
        ('["unterminated', []),
    ],
)
def test_parse_facts(raw, expected):
    assert _parse_facts(raw) == expected


async def test_add_memory_persists_under_user_namespace():
    store = FakeStore()

    entry = await add_memory(store, "u1", "Prefers concise answers")

    namespace, key, value = store.puts[0]
    assert namespace == ("memories", "u1")
    assert key == entry.key
    assert value["text"] == "Prefers concise answers"
    assert value["source"] == "manual"


async def test_add_memory_enforces_per_user_cap(monkeypatch):
    monkeypatch.setattr(settings, "memory_max_per_user", 3)
    store = FakeStore(existing=3)

    with pytest.raises(MemoryLimitError):
        await add_memory(store, "u1", "one too many")

    assert store.puts == []
