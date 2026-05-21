"""
Application configuration loaded from environment variables.
Uses pydantic-settings for full .env file and env-var support.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    app_name: str = "Skynet Flight Operations Module"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/skynet"

    # JWT / Security
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_openssl_rand_hex_32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
