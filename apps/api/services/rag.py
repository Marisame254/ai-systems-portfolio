"""RAG service: document upload, chunking, embedding persistence (pgvector), search.

Two storage layers:
- `rag_documents` table (this module): one row per uploaded file. Enforces per-user limit.
- PGVector (langchain_postgres): chunks + embeddings under a collection name, with JSONB
  metadata for filtering by user_id / document_id / filename.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from io import BytesIO
from typing import Any
from uuid import UUID, uuid4

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from psycopg_pool import AsyncConnectionPool

from core.config import settings

logger = logging.getLogger(__name__)


SUPPORTED_TYPES = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/markdown": "md",
    "text/x-markdown": "md",
}

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}


DDL = """
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    chunks_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS rag_documents_user_idx ON rag_documents(user_id);
"""


class RAGError(Exception):
    """Domain error for RAG operations. Routes map to HTTP status codes."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


@dataclass
class DocumentRow:
    id: str
    user_id: str
    filename: str
    content_type: str
    byte_size: int
    chunks_count: int
    created_at: str


@dataclass
class SearchHit:
    content: str
    score: float
    filename: str
    page: int | None
    chunk_index: int
    document_id: str


def _ext_for(filename: str) -> str:
    name = filename.lower()
    for ext in SUPPORTED_EXTENSIONS:
        if name.endswith(ext):
            return ext
    return ""


def _normalize_content_type(filename: str, content_type: str | None) -> str:
    if content_type in SUPPORTED_TYPES:
        return content_type
    ext = _ext_for(filename)
    if ext == ".pdf":
        return "application/pdf"
    if ext in {".md", ".markdown"}:
        return "text/markdown"
    if ext == ".txt":
        return "text/plain"
    raise RAGError(
        f"Unsupported file type: {content_type or 'unknown'} ({filename}). Allowed: PDF, TXT, MD.",
        status_code=415,
    )


def _parse_to_documents(raw: bytes, filename: str, content_type: str) -> list[Document]:
    if content_type == "application/pdf":
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(raw))
        docs: list[Document] = []
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text() or ""
            except Exception:  # noqa: BLE001
                logger.exception("pypdf: failed to extract page %s of %s", i, filename)
                text = ""
            text = text.strip()
            if text:
                docs.append(Document(page_content=text, metadata={"page": i + 1}))
        if not docs:
            raise RAGError(f"Could not extract any text from {filename}. Is it a scanned/image-only PDF?")
        return docs

    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise RAGError(f"{filename}: file is not valid UTF-8 text.") from exc
    text = text.strip()
    if not text:
        raise RAGError(f"{filename} is empty.")
    return [Document(page_content=text, metadata={})]


class RAGService:
    def __init__(self, vector_store: PGVector, pool: AsyncConnectionPool):
        self.vector_store = vector_store
        self.pool = pool
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.rag_chunk_size,
            chunk_overlap=settings.rag_chunk_overlap,
        )

    # -- metadata layer (rag_documents) --

    async def count_documents(self, user_id: str) -> int:
        async with self.pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                "SELECT COUNT(*) FROM rag_documents WHERE user_id = %s",
                (user_id,),
            )
            row = await cur.fetchone()
        return int(row[0]) if row else 0

    async def list_documents(self, user_id: str) -> list[DocumentRow]:
        async with self.pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, filename, content_type, byte_size, chunks_count, created_at "
                "FROM rag_documents WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            rows = await cur.fetchall()
        return [
            DocumentRow(
                id=str(r[0]),
                user_id=r[1],
                filename=r[2],
                content_type=r[3],
                byte_size=int(r[4]),
                chunks_count=int(r[5]),
                created_at=r[6].isoformat() if r[6] else "",
            )
            for r in rows
        ]

    async def _find_document(self, user_id: str, doc_id: str) -> DocumentRow | None:
        try:
            UUID(doc_id)
        except ValueError:
            return None
        async with self.pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, filename, content_type, byte_size, chunks_count, created_at "
                "FROM rag_documents WHERE id = %s AND user_id = %s",
                (doc_id, user_id),
            )
            r = await cur.fetchone()
        if not r:
            return None
        return DocumentRow(
            id=str(r[0]),
            user_id=r[1],
            filename=r[2],
            content_type=r[3],
            byte_size=int(r[4]),
            chunks_count=int(r[5]),
            created_at=r[6].isoformat() if r[6] else "",
        )

    # -- upload --

    async def upload_document(
        self,
        user_id: str,
        filename: str,
        raw: bytes,
        content_type: str | None,
    ) -> DocumentRow:
        if not user_id:
            raise RAGError("Missing user_id.")
        if not raw:
            raise RAGError(f"{filename} is empty.")
        if len(raw) > settings.rag_max_upload_bytes:
            raise RAGError(
                f"File too large ({len(raw)} bytes). Max {settings.rag_max_upload_bytes}.",
                status_code=413,
            )

        ct = _normalize_content_type(filename, content_type)

        count = await self.count_documents(user_id)
        if count >= settings.rag_max_docs_per_user:
            raise RAGError(
                f"Document limit reached ({count}/{settings.rag_max_docs_per_user}). "
                "Delete one before uploading another.",
                status_code=400,
            )

        page_docs = _parse_to_documents(raw, filename, ct)

        # Split each parsed page/segment into chunks while preserving the page metadata.
        chunks: list[Document] = []
        chunk_index = 0
        doc_id = str(uuid4())
        for pd in page_docs:
            for piece in self.splitter.split_text(pd.page_content):
                meta: dict[str, Any] = {
                    "user_id": user_id,
                    "document_id": doc_id,
                    "filename": filename,
                    "content_type": ct,
                    "chunk_index": chunk_index,
                }
                if "page" in pd.metadata:
                    meta["page"] = pd.metadata["page"]
                chunks.append(Document(page_content=piece, metadata=meta))
                chunk_index += 1

        if not chunks:
            raise RAGError(f"{filename}: no chunks produced after splitting.")

        # Insert rag_documents row first so a failed embedding leaves no orphans we can't trace.
        async with self.pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO rag_documents (id, user_id, filename, content_type, byte_size, chunks_count) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (doc_id, user_id, filename, ct, len(raw), len(chunks)),
            )

        try:
            await self.vector_store.aadd_documents(chunks, ids=[str(uuid4()) for _ in chunks])
        except Exception:
            logger.exception("RAG: vector_store.aadd_documents failed; rolling back rag_documents row")
            async with self.pool.connection() as conn, conn.cursor() as cur:
                await cur.execute("DELETE FROM rag_documents WHERE id = %s", (doc_id,))
            raise RAGError("Failed to index document. Check embeddings provider.")

        row = await self._find_document(user_id, doc_id)
        if row is None:
            raise RAGError("Document not found after insertion")
        return row

    # -- delete --

    async def delete_document(self, user_id: str, doc_id: str) -> bool:
        row = await self._find_document(user_id, doc_id)
        if row is None:
            return False
        # PGVector stores chunks in langchain_pg_embedding with cmetadata JSONB. Filter on
        # document_id + user_id (defense in depth) to remove only this doc's chunks.
        async with self.pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM langchain_pg_embedding "
                "WHERE cmetadata->>'document_id' = %s "
                "  AND cmetadata->>'user_id' = %s",
                (doc_id, user_id),
            )
            await cur.execute(
                "DELETE FROM rag_documents WHERE id = %s AND user_id = %s",
                (doc_id, user_id),
            )
        return True

    # -- search --

    async def search(
        self,
        query: str,
        user_id: str,
        top_k: int = 4,
        filename: str | None = None,
    ) -> list[SearchHit]:
        if not user_id:
            return []
        filter_: dict[str, Any] = {"user_id": user_id}
        if filename:
            filter_["filename"] = filename
        try:
            results = await self.vector_store.asimilarity_search_with_score(query, k=top_k, filter=filter_)
        except Exception:
            logger.exception("RAG: similarity search failed")
            return []
        hits: list[SearchHit] = []
        for doc, score in results:
            md = doc.metadata or {}
            hits.append(
                SearchHit(
                    content=doc.page_content,
                    score=float(score),
                    filename=str(md.get("filename", "")),
                    page=int(md["page"]) if md.get("page") is not None else None,
                    chunk_index=int(md.get("chunk_index", 0)),
                    document_id=str(md.get("document_id", "")),
                )
            )
        return hits


async def init_rag_service(pool: AsyncConnectionPool, embeddings: Embeddings) -> RAGService:
    """Create the rag_documents table and the PGVector collection."""
    async with pool.connection() as conn, conn.cursor() as cur:
        for statement in [s.strip() for s in DDL.split(";") if s.strip()]:
            await cur.execute(statement)

    vector_store = PGVector(
        embeddings=embeddings,
        collection_name=settings.rag_collection_name,
        connection=settings.sqlalchemy_psycopg_url,
        use_jsonb=True,
        async_mode=True,
    )
    # Ensure the collection row exists (PGVector creates lazily on first add, but this surfaces
    # errors at startup instead of on first upload).
    try:
        await vector_store.acreate_collection()
    except Exception:  # noqa: BLE001
        logger.exception("RAG: acreate_collection failed (may already exist)")

    logger.info(
        "RAG ready: provider=%s model=%s dim=%s collection=%s",
        settings.embedding_provider,
        settings.embedding_model,
        settings.embedding_dim,
        settings.rag_collection_name,
    )
    return RAGService(vector_store=vector_store, pool=pool)
