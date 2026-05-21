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

    def __init__(self, **values):
        super().__init__(**values)
        import os

        # 1. Gather all potential database URLs from env
        env_url = None
        for env_name in ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL"]:
            val = os.environ.get(env_name)
            if val:
                env_url = val
                break

        # 2. Use env_url if present, else use self.database_url (could be loaded from .env or default)
        db_url = env_url or self.database_url

        # 3. Detect Vercel environment
        is_vercel = os.environ.get("VERCEL") == "1" or "AWS_LAMBDA_FUNCTION_NAME" in os.environ

        # 4. If on Vercel and pointing to localhost default postgres, fallback to writable SQLite in /tmp
        if is_vercel:
            is_localhost = "localhost" in db_url or "127.0.0.1" in db_url
            if not env_url or is_localhost:
                db_url = "sqlite:////tmp/airman.db"
                print(f"Vercel detected. Automatically switching database to SQLite at /tmp/airman.db to run out-of-the-box.")

        # 5. Normalize Postgres URL protocols for SQLAlchemy compatibility
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

        self.database_url = db_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
