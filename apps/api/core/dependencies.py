from functools import lru_cache

from langchain_core.language_models import BaseChatModel

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
