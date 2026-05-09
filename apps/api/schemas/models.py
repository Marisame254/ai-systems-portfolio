from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class RAGQueryRequest(BaseModel):
    query: str
    session_id: str | None = None
    top_k: int = 5


class AgentRunRequest(BaseModel):
    input: str
    config: dict = {}
