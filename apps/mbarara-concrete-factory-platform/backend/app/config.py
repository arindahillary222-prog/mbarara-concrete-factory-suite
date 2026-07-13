from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Mbarara Integrated Concrete Products Factory API"
    environment: Literal["local", "staging", "production"] = "local"
    database_url: str = Field(
        default="postgresql+asyncpg://mbarara:mbarara@localhost:5432/mbarara_factory",
        description="Async SQLAlchemy PostgreSQL connection URL.",
    )
    auto_create_tables: bool = Field(
        default=False,
        description="Local-only convenience. Production should use migrations/001_initial_schema.sql.",
    )
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"])
    api_secret_key: str = Field(
        default="change-this-before-production",
        description="Secret used to sign owner/staff access tokens. Set a strong value in production.",
    )
    access_token_expire_minutes: int = Field(default=720)
    bootstrap_owner_setup_key: str | None = Field(
        default=None,
        description="Optional one-time setup key required by /api/v1/auth/bootstrap-owner.",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
