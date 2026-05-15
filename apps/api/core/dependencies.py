from functools import lru_cache
from typing import TYPE_CHECKING

from fastapi import Request
from langchain_core.embeddings import Embeddings
from langchain_core.language_models import BaseChatModel
from langgraph.graph.state import CompiledStateGraph
from langgraph.store.base import BaseStore

from core.config import settings

if TYPE_CHECKING:
    from services.rag import RAGService


@lru_cache(maxsize=1)
def get_chat_model() -> BaseChatModel:
    if settings.environment == "prod":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            streaming=True,
        )

    from langchain_ollama import ChatOllama

    return ChatOllama(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
    )


@lru_cache(maxsize=1)
def get_embeddings() -> Embeddings:
    if settings.environment == "prod":
        from langchain_openai import OpenAIEmbeddings

        return OpenAIEmbeddings(
            model=settings.openai_embedding_model,
            api_key=settings.openai_api_key,
        )

    from langchain_ollama import OllamaEmbeddings

    return OllamaEmbeddings(
        model=settings.ollama_embedding_model,
        base_url=settings.ollama_base_url,
    )


def get_chat_agent(request: Request) -> CompiledStateGraph:
    """Resolved at request-time from FastAPI app.state (built in lifespan)."""
    return request.app.state.chat_agent


def get_memory_store(request: Request) -> BaseStore:
    """Resolved at request-time from FastAPI app.state (built in lifespan)."""
    return request.app.state.memory_store


def get_rag_service(request: Request) -> "RAGService":
    """Resolved at request-time from FastAPI app.state (built in lifespan)."""
    return request.app.state.rag_service
