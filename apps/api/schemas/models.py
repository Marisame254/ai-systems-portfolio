from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    thread_id: str
    user_id: str | None = None
    checkpoint_id: str | None = None
    history: list[ChatMessage] = []  # legacy, ignored when checkpointer is active


class MemoryEntry(BaseModel):
    key: str
    text: str
    source: Literal["auto", "manual"]
    created_at: str


class MemoryListResponse(BaseModel):
    user_id: str
    entries: list[MemoryEntry]


class MemoryCreateRequest(BaseModel):
    text: str


class RAGQueryRequest(BaseModel):
    query: str
    user_id: str
    filename: str | None = None
    top_k: int = 4


class DocumentInfo(BaseModel):
    id: str
    filename: str
    content_type: str
    byte_size: int
    chunks_count: int
    created_at: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentInfo]
    count: int
    max: int


class RAGSource(BaseModel):
    content: str
    score: float
    filename: str
    page: int | None = None
    chunk_index: int
    document_id: str


class RAGQueryResponse(BaseModel):
    answer: str
    sources: list[RAGSource]
    model: str


class RAGInfo(BaseModel):
    provider: Literal["ollama", "openai"]
    embedding_model: str
    dim: int
    max_docs_per_user: int
    max_upload_bytes: int
    supported_types: list[str]


class AgentRunRequest(BaseModel):
    input: str
    config: dict = {}
