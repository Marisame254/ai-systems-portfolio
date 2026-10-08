import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from api.sse import SSE_DONE, SSE_HEADERS, sse_event
from core.config import settings
from core.dependencies import get_chat_model, get_rag_service
from core.rate_limit import rate_limit
from schemas.models import (
    ID_MAX_CHARS,
    DocumentInfo,
    DocumentListResponse,
    RAGInfo,
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSource,
)
from services.rag import SUPPORTED_EXTENSIONS, RAGError, RAGService, SearchHit

logger = logging.getLogger(__name__)

router = APIRouter()


RAG_PROMPT = (
    "You are a helpful assistant. Answer the user's question using ONLY the numbered context below.\n"
    "If the context does not contain the answer, say so clearly — do not make things up.\n"
    "Cite the context you rely on inline with its bracketed number, e.g. [1] or [2][3].\n"
    "Answer in the same language as the question.\n\n"
    "Context:\n{context}\n\n"
    "Question: {query}\n\nAnswer:"
)

NO_HITS_ANSWER = (
    "No relevant content found in your uploaded documents. "
    "Try uploading a document first, or rephrase the question."
)


def _row_to_info(row) -> DocumentInfo:
    return DocumentInfo(
        id=row.id,
        filename=row.filename,
        content_type=row.content_type,
        byte_size=row.byte_size,
        chunks_count=row.chunks_count,
        created_at=row.created_at,
    )


def _chat_model_name() -> str:
    return settings.openai_model if settings.environment == "prod" else settings.ollama_model


def build_prompt(query: str, hits: list[SearchHit]) -> str:
    """Number each chunk so the model's [n] citations map to the order of the returned sources."""
    blocks = []
    for n, h in enumerate(hits, start=1):
        loc = f"page {h.page}" if h.page is not None else f"chunk {h.chunk_index}"
        blocks.append(f"[{n}] {h.filename}, {loc}\n{h.content}")
    return RAG_PROMPT.format(context="\n\n---\n\n".join(blocks), query=query)


def _to_sources(hits: list[SearchHit]) -> list[RAGSource]:
    return [
        RAGSource(
            content=h.content,
            score=h.score,
            filename=h.filename,
            page=h.page,
            chunk_index=h.chunk_index,
            document_id=h.document_id,
        )
        for h in hits
    ]


async def _search(request: RAGQueryRequest, rag: RAGService) -> list[SearchHit]:
    try:
        return await rag.search(
            query=request.query,
            user_id=request.user_id,
            top_k=request.top_k,
            filename=request.filename,
        )
    except RAGError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))


@router.get("/info", response_model=RAGInfo)
async def rag_info():
    return RAGInfo(
        provider=settings.embedding_provider,
        embedding_model=settings.embedding_model,
        dim=settings.embedding_dim,
        max_docs_per_user=settings.rag_max_docs_per_user,
        max_upload_bytes=settings.rag_max_upload_bytes,
        supported_types=sorted(SUPPORTED_EXTENSIONS),
    )


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    user_id: str = Query(..., min_length=1, max_length=ID_MAX_CHARS),
    rag: RAGService = Depends(get_rag_service),
):
    rows = await rag.list_documents(user_id)
    return DocumentListResponse(
        documents=[_row_to_info(r) for r in rows],
        count=len(rows),
        max=settings.rag_max_docs_per_user,
    )


@router.post(
    "/upload",
    response_model=DocumentInfo,
    dependencies=[Depends(rate_limit("rag_upload", "rate_limit_rag_upload"))],
)
async def upload_document(
    user_id: str = Form(..., min_length=1, max_length=ID_MAX_CHARS),
    file: UploadFile = File(...),
    rag: RAGService = Depends(get_rag_service),
):
    # Reject oversized uploads before pulling the whole body into memory.
    if file.size is not None and file.size > settings.rag_max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file.size} bytes). Max {settings.rag_max_upload_bytes}.",
        )
    raw = await file.read()
    try:
        row = await rag.upload_document(
            user_id=user_id,
            filename=file.filename or "untitled",
            raw=raw,
            content_type=file.content_type,
        )
    except RAGError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))
    return _row_to_info(row)


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    user_id: str = Query(..., min_length=1, max_length=ID_MAX_CHARS),
    rag: RAGService = Depends(get_rag_service),
):
    deleted = await rag.delete_document(user_id=user_id, doc_id=doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": doc_id}


@router.post(
    "/query",
    response_model=RAGQueryResponse,
    dependencies=[Depends(rate_limit("rag_query", "rate_limit_rag_query"))],
)
async def query_rag(
    request: RAGQueryRequest,
    rag: RAGService = Depends(get_rag_service),
):
    hits = await _search(request, rag)
    if not hits:
        return RAGQueryResponse(answer=NO_HITS_ANSWER, sources=[], model=_chat_model_name())

    try:
        response = await get_chat_model().ainvoke(build_prompt(request.query, hits))
        answer = response.content if isinstance(response.content, str) else str(response.content)
    except Exception as exc:  # noqa: BLE001
        logger.exception("rag.query LLM call failed")
        raise HTTPException(status_code=502, detail="LLM call failed.") from exc

    return RAGQueryResponse(answer=answer, sources=_to_sources(hits), model=_chat_model_name())


async def _generate_answer_stream(request: RAGQueryRequest, hits: list[SearchHit]):
    # Sources go first so the UI can render them while the answer is still streaming.
    # An empty list means nothing cleared the similarity threshold; no answer is generated.
    yield sse_event(
        {
            "type": "sources",
            "sources": [s.model_dump() for s in _to_sources(hits)],
            "model": _chat_model_name(),
        }
    )
    if hits:
        try:
            async for chunk in get_chat_model().astream(build_prompt(request.query, hits)):
                text = chunk.content if isinstance(chunk.content, str) else ""
                if text:
                    yield sse_event({"type": "token", "text": text})
        except Exception:  # noqa: BLE001
            logger.exception("rag.query_stream LLM call failed")
            yield sse_event({"type": "error", "message": "LLM call failed."})
    yield SSE_DONE


@router.post(
    "/query/stream",
    dependencies=[Depends(rate_limit("rag_query", "rate_limit_rag_query"))],
)
async def query_rag_stream(
    request: RAGQueryRequest,
    rag: RAGService = Depends(get_rag_service),
):
    hits = await _search(request, rag)
    return StreamingResponse(
        _generate_answer_stream(request, hits),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
