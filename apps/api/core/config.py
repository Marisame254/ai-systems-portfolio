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


settings = Settings()
