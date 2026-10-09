"""Search over the site owner's profile (services/portfolio_profile.md), for the agent tool.

The profile is a handful of sections, so they are embedded once into an in-memory vector store
on first use instead of living in Postgres.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import InMemoryVectorStore

logger = logging.getLogger(__name__)

PROFILE_PATH = Path(__file__).with_name("portfolio_profile.md")


@dataclass(frozen=True)
class ProfileSection:
    title: str
    text: str


def parse_sections(markdown: str) -> list[ProfileSection]:
    """Split on `## ` headings; anything before the first one is a note for editors."""
    sections: list[ProfileSection] = []
    title: str | None = None
    lines: list[str] = []
    for line in markdown.splitlines():
        if line.startswith("## "):
            if title is not None and "\n".join(lines).strip():
                sections.append(ProfileSection(title, "\n".join(lines).strip()))
            title = line[3:].strip()
            lines = []
        elif title is not None:
            lines.append(line)
    if title is not None and "\n".join(lines).strip():
        sections.append(ProfileSection(title, "\n".join(lines).strip()))
    return sections


def format_sections(sections: list[ProfileSection]) -> str:
    return "\n\n".join(f"## {s.title}\n{s.text}" for s in sections)


class PortfolioSearch:
    def __init__(self, embeddings: Embeddings, path: Path = PROFILE_PATH):
        self.sections = parse_sections(path.read_text(encoding="utf-8"))
        self._embeddings = embeddings
        self._store: InMemoryVectorStore | None = None
        self._lock = asyncio.Lock()

    async def _index(self) -> InMemoryVectorStore:
        async with self._lock:
            if self._store is None:
                store = InMemoryVectorStore(self._embeddings)
                await store.aadd_documents(
                    [
                        Document(page_content=f"{s.title}\n{s.text}", metadata={"index": i})
                        for i, s in enumerate(self.sections)
                    ]
                )
                self._store = store
        return self._store

    async def search(self, query: str, top_k: int = 4) -> list[ProfileSection]:
        """Sections closest to the query. Falls back to the whole profile if embeddings fail."""
        try:
            store = await self._index()
            docs = await store.asimilarity_search(query, k=top_k)
        except Exception:  # noqa: BLE001
            logger.exception("portfolio search: embeddings unavailable, returning the full profile")
            return list(self.sections)
        return [self.sections[d.metadata["index"]] for d in docs]
