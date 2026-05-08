from fastapi import APIRouter, UploadFile, File
from schemas.models import RAGQueryRequest

router = APIRouter()

MOCK_CHUNKS = [
    {
        "content": "LangGraph is a library for building stateful, multi-actor applications with LLMs.",
        "score": 0.95,
    },
    {
        "content": "RAG systems combine retrieval with generation to ground LLM responses in documents.",
        "score": 0.87,
    },
]


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    return {
        "status": "processed",
        "filename": file.filename,
        "chunks": 42,
        "message": "Document indexed successfully (demo mode)",
    }


@router.post("/query")
async def query_rag(request: RAGQueryRequest):
    return {
        "answer": (
            f"Based on the indexed documents, here's what I found about '{request.query}': "
            "LangGraph enables complex agent workflows with conditional routing, memory management, "
            "and tool integration. This demo runs in stub mode — connect a real pgvector database "
            "to enable live document retrieval."
        ),
        "sources": MOCK_CHUNKS,
        "model": "claude-sonnet-4-6",
    }
