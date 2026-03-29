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

    class Config:
        # Always load the backend/.env file regardless of the process working directory.
        env_file = str(Path(__file__).resolve().parents[2] / ".env")

settings = Settings()
