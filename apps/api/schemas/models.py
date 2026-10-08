from typing import Literal

from pydantic import BaseModel, Field

ID_MAX_CHARS = 100


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    thread_id: str = Field(min_length=1, max_length=ID_MAX_CHARS)
    user_id: str | None = Field(default=None, max_length=ID_MAX_CHARS)
    checkpoint_id: str | None = Field(default=None, max_length=ID_MAX_CHARS)


class ThreadIdsRequest(BaseModel):
    thread_ids: list[str] = Field(default_factory=list, max_length=50)


class MemoryEntry(BaseModel):
    key: str
    text: str
    source: Literal["auto", "manual"]
    created_at: str


class MemoryListResponse(BaseModel):
    user_id: str
    entries: list[MemoryEntry]


class MemoryCreateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=300)


class RAGQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    user_id: str = Field(min_length=1, max_length=ID_MAX_CHARS)
    filename: str | None = Field(default=None, max_length=255)
    top_k: int = Field(default=4, ge=1, le=8)


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
    score: float  # cosine similarity, 0–1, higher is more relevant
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
