"""Application configuration — everything comes from the environment.

Copy `.env.example` to `.env` and set DATABASE_URL there.
"""
import os
from dataclasses import dataclass


def _get(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


@dataclass(frozen=True)
class Settings:
    database_url: str = _get(
        "DATABASE_URL",
        "postgresql://smartrecruit:smartrecruit@localhost:5432/smartrecruit",
    )
    jwt_secret: str = _get("JWT_SECRET", "dev-only-change-me")
    jwt_algorithm: str = _get("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(_get("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))
    upload_dir: str = _get("UPLOAD_DIR", "uploads")


settings = Settings()
