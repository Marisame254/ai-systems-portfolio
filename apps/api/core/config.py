from pathlib import Path
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Repo root: apps/api/core/config.py → parents[3]
ENV_PATH = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Portfolio API"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    environment: Literal["dev", "prod"] = "dev"

    # Ollama (dev)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3-coder:480b-cloud"

    # OpenAI (prod)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Embeddings (mirror chat provider per environment)
    ollama_embedding_model: str = "nomic-embed-text"
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dim_dev: int = 768
    embedding_dim_prod: int = 1536

    # RAG
    rag_collection_name: str = "portfolio_rag"
    rag_max_docs_per_user: int = 3
    rag_max_upload_bytes: int = 10 * 1024 * 1024
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 200
    rag_top_k: int = 4

    # Agent tools
    tavily_api_key: str = ""
    agent_max_iterations: int = 5

    database_url: str = "postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio"
    redis_url: str = "redis://localhost:6379"

    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    @property
    def postgres_dsn(self) -> str:
        """psycopg-style DSN (without SQLAlchemy +driver suffix)."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql://")

    @property
    def sqlalchemy_psycopg_url(self) -> str:
        """SQLAlchemy URL using sync psycopg driver (used by PGVector)."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")

    @property
    def embedding_dim(self) -> int:
        return self.embedding_dim_prod if self.environment == "prod" else self.embedding_dim_dev

    @property
    def embedding_provider(self) -> str:
        return "openai" if self.environment == "prod" else "ollama"

    @property
    def embedding_model(self) -> str:
        return self.openai_embedding_model if self.environment == "prod" else self.ollama_embedding_model


settings = Settings()
