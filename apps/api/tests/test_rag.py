import pytest
from langchain_core.documents import Document

from api.routes.rag import build_prompt
from core.config import settings
from services.rag import (
    RAGError,
    RAGService,
    SearchHit,
    _normalize_content_type,
    distance_to_similarity,
)


class FakeVectorStore:
    def __init__(self, results=None, error: Exception | None = None):
        self.results = results or []
        self.error = error
        self.calls: list[dict] = []

    async def asimilarity_search_with_score(self, query, k, filter):
        self.calls.append({"query": query, "k": k, "filter": filter})
        if self.error:
            raise self.error
        return self.results


def _doc(text: str, **metadata) -> Document:
    return Document(page_content=text, metadata={"filename": "a.pdf", "chunk_index": 0, **metadata})


@pytest.mark.parametrize(
    ("distance", "expected"),
    [(0.0, 1.0), (0.25, 0.75), (1.0, 0.0), (1.6, 0.0), (-0.1, 1.0)],
)
def test_distance_to_similarity(distance, expected):
    assert distance_to_similarity(distance) == pytest.approx(expected)


async def test_search_returns_similarity_and_drops_weak_chunks(monkeypatch):
    monkeypatch.setattr(settings, "rag_min_similarity", 0.3)
    store = FakeVectorStore(
        results=[(_doc("close", page=2), 0.1), (_doc("far"), 0.9)],
    )
    service = RAGService(vector_store=store, pool=None)

    hits = await service.search("q", user_id="u1", top_k=4, filename="a.pdf")

    assert [h.content for h in hits] == ["close"]
    assert hits[0].score == pytest.approx(0.9)
    assert hits[0].page == 2
    assert store.calls[0]["filter"] == {"user_id": "u1", "filename": "a.pdf"}


async def test_search_surfaces_provider_failure():
    service = RAGService(vector_store=FakeVectorStore(error=RuntimeError("down")), pool=None)

    with pytest.raises(RAGError) as exc_info:
        await service.search("q", user_id="u1")

    assert exc_info.value.status_code == 503


async def test_search_without_user_returns_nothing():
    store = FakeVectorStore(results=[(_doc("x"), 0.0)])

    assert await RAGService(vector_store=store, pool=None).search("q", user_id="") == []
    assert store.calls == []


def test_normalize_content_type_falls_back_to_extension():
    assert _normalize_content_type("notes.MD", "application/octet-stream") == "text/markdown"
    assert _normalize_content_type("paper.pdf", None) == "application/pdf"


def test_normalize_content_type_rejects_unknown():
    with pytest.raises(RAGError) as exc_info:
        _normalize_content_type("photo.png", "image/png")

    assert exc_info.value.status_code == 415


def test_build_prompt_numbers_chunks_in_source_order():
    hits = [
        SearchHit("alpha", 0.9, "a.pdf", 3, 0, "d1"),
        SearchHit("beta", 0.8, "b.md", None, 7, "d2"),
    ]

    prompt = build_prompt("what?", hits)

    assert "[1] a.pdf, page 3\nalpha" in prompt
    assert "[2] b.md, chunk 7\nbeta" in prompt
    assert prompt.index("[1] a.pdf") < prompt.index("[2] b.md")
    assert "Question: what?" in prompt
