from functools import lru_cache

from fastapi import Request
from langchain_core.language_models import BaseChatModel
from langgraph.graph.state import CompiledStateGraph

from core.config import settings


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


def get_chat_agent(request: Request) -> CompiledStateGraph:
    """Resolved at request-time from FastAPI app.state (built in lifespan)."""
    return request.app.state.chat_agent
