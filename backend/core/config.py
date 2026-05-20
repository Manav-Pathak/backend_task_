import os
from dataclasses import dataclass


def _get_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return int(raw_value)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Internshala Notes API")
    api_v1_prefix: str = "/api/v1"
    database_url: str = os.getenv(
        "DATABASE_URL",
        os.getenv(
            "LOCAL_DATABASE_URL",
            "postgresql://manav:manav1234@localhost:5432/intershala",
        ),
    )
    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-development-secret-before-production",
    )
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_token_minutes: int = _get_int("JWT_ACCESS_TOKEN_MINUTES", 60)
    frontend_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:8000").split(",")
        if origin.strip()
    )


settings = Settings()
