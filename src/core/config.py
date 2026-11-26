
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "BiTBiT API"
    DEBUG: bool = False

    # Example:
    # postgresql+asyncpg://user:password@localhost:5432/bitbit
    DATABASE_URL: str

    # Per-process connection pool limits
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 5
    DB_POOL_TIMEOUT: int = 10
    DB_POOL_RECYCLE: int = 1800

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # Leave empty to disable KYC submission until a Fernet key is configured.
    KYC_ENCRYPTION_KEY: str = ""
    KYC_UPLOAD_DIR: str = "var/kyc"


@lru_cache
def get_settings() -> Settings:
    return Settings()
