from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash"
    EXCHANGE_RATE_BASE_URL: str = "https://api.exchangerate-api.com/v4/latest"
    RESTCOUNTRIES_URL: str = "https://restcountries.com/v3.1/all?fields=name,currencies"

    # CORS
    # Comma-separated list of explicit allowed origins (useful for prod).
    CORS_ORIGINS: str = "http://localhost:5173"
    # Allow any localhost/127.0.0.1 port during local development.
    CORS_ALLOW_ORIGIN_REGEX: Optional[str] = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    class Config:
        # Always load the backend/.env file regardless of the process working directory.
        env_file = str(Path(__file__).resolve().parents[2] / ".env")

settings = Settings()
