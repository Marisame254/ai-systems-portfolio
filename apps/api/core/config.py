from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Portfolio API"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"

    database_url: str = "postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio"
    redis_url: str = "redis://localhost:6379"

    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
