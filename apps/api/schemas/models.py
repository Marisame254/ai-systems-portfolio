from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    thread_id: str
    user_id: str | None = None
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
    session_id: str | None = None
    top_k: int = 5


class AgentRunRequest(BaseModel):
    input: str
    config: dict = {}
