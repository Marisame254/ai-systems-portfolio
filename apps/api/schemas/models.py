from pydantic import BaseModel
from typing import Literal


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
