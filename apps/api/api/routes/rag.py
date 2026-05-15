from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from core.config import settings
from core.dependencies import get_chat_model, get_rag_service
from schemas.models import (
    DocumentInfo,
    DocumentListResponse,
    RAGInfo,
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSource,
)
from services.rag import SUPPORTED_EXTENSIONS, RAGError, RAGService

router = APIRouter()


RAG_PROMPT = (
    "You are a helpful assistant. Answer the user's question using ONLY the context below.\n"
    "If the context does not contain the answer, say so clearly — do not make things up.\n"
    "When you cite a fact, mention which document and page it came from.\n\n"
    "Context:\n{context}\n\n"
    "Question: {query}\n\nAnswer:"
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
    user_id: str = Query(..., min_length=1),
    rag: RAGService = Depends(get_rag_service),
):
    rows = await rag.list_documents(user_id)
    return DocumentListResponse(
        documents=[_row_to_info(r) for r in rows],
        count=len(rows),
        max=settings.rag_max_docs_per_user,
    )


@router.post("/upload", response_model=DocumentInfo)
async def upload_document(
    user_id: str = Form(..., min_length=1),
    file: UploadFile = File(...),
    rag: RAGService = Depends(get_rag_service),
):
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
    user_id: str = Query(..., min_length=1),
    rag: RAGService = Depends(get_rag_service),
):
    deleted = await rag.delete_document(user_id=user_id, doc_id=doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": doc_id}


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest,
    rag: RAGService = Depends(get_rag_service),
):
    hits = await rag.search(
        query=request.query,
        user_id=request.user_id,
        top_k=request.top_k or settings.rag_top_k,
        filename=request.filename,
    )

    if not hits:
        return RAGQueryResponse(
            answer=(
                "No relevant content found in your uploaded documents. "
                "Try uploading a document first, or rephrase the question."
            ),
            sources=[],
            model=settings.embedding_model,
        )

    context_blocks = []
    for h in hits:
        loc = f"page {h.page}" if h.page is not None else f"chunk {h.chunk_index}"
        context_blocks.append(f"[{h.filename}, {loc}]\n{h.content}")
    context = "\n\n---\n\n".join(context_blocks)

    model = get_chat_model()
    try:
        response = await model.ainvoke(RAG_PROMPT.format(context=context, query=request.query))
        answer = response.content if isinstance(response.content, str) else str(response.content)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM call failed: {exc}")

    model_name = settings.openai_model if settings.environment == "prod" else settings.ollama_model

    return RAGQueryResponse(
        answer=answer,
        sources=[
            RAGSource(
                content=h.content,
                score=h.score,
                filename=h.filename,
                page=h.page,
                chunk_index=h.chunk_index,
                document_id=h.document_id,
            )
            for h in hits
        ],
        model=model_name,
    )
