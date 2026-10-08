import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from core import rate_limit as rate_limit_module
from core.config import settings
from core.rate_limit import rate_limit
from schemas.models import ChatRequest, MemoryCreateRequest, RAGQueryRequest, ThreadIdsRequest


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_chat", 2)
    rate_limit_module._hits.clear()

    app = FastAPI()

    @app.get("/limited", dependencies=[Depends(rate_limit("chat", "rate_limit_chat"))])
    async def limited():
        return {"ok": True}

    yield TestClient(app)
    rate_limit_module._hits.clear()


def test_rate_limit_blocks_after_limit(client):
    assert client.get("/limited").status_code == 200
    assert client.get("/limited").status_code == 200

    blocked = client.get("/limited")

    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) >= 1
    assert "Too many requests" in blocked.json()["detail"]


def test_rate_limit_is_per_client_ip(client):
    for _ in range(2):
        assert client.get("/limited", headers={"x-forwarded-for": "1.1.1.1"}).status_code == 200

    assert client.get("/limited", headers={"x-forwarded-for": "1.1.1.1"}).status_code == 429
    assert client.get("/limited", headers={"x-forwarded-for": "2.2.2.2, 10.0.0.1"}).status_code == 200


def test_rate_limit_window_expires(client, monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(rate_limit_module.time, "monotonic", lambda: now[0])

    assert client.get("/limited").status_code == 200
    assert client.get("/limited").status_code == 200
    assert client.get("/limited").status_code == 429

    now[0] += settings.rate_limit_window_seconds

    assert client.get("/limited").status_code == 200


@pytest.mark.parametrize(
    "build",
    [
        lambda: ChatRequest(message="x" * 4001, thread_id="t"),
        lambda: ChatRequest(message="", thread_id="t"),
        lambda: ChatRequest(message="hi", thread_id="t" * 101),
        lambda: RAGQueryRequest(query="x" * 1001, user_id="u"),
        lambda: RAGQueryRequest(query="q", user_id="u", top_k=0),
        lambda: RAGQueryRequest(query="q", user_id="u", top_k=9),
        lambda: MemoryCreateRequest(text="x" * 301),
        lambda: ThreadIdsRequest(thread_ids=["t"] * 51),
    ],
)
def test_requests_reject_out_of_bounds_input(build):
    with pytest.raises(ValidationError):
        build()


def test_requests_accept_values_at_the_bounds():
    assert ChatRequest(message="x" * 4000, thread_id="t").user_id is None
    assert RAGQueryRequest(query="q", user_id="u").top_k == 4
    assert RAGQueryRequest(query="q", user_id="u", top_k=8).top_k == 8
