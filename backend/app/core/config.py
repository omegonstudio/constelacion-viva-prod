import os
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal, Optional


class Settings(BaseSettings):
    # Database
    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""))
    
    # JWT
    secret_key: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"
    
    # Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    environment: Literal["development", "staging", "production"] = "development"
    
    # S3 (Optional - required only in production when S3 features are used)
    s3_bucket: Optional[str] = None
    s3_region: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_endpoint: Optional[str] = None
    s3_public_endpoint: Optional[str] = None
    
    # Mercado Pago
    mercado_pago_access_token: str = ""
    mercado_pago_webhook_token: str = ""
    # Alias names requested for Objetivo 2
    mp_access_token: str = ""
    mp_webhook_secret: str = ""
    
    # Email
    resend_api_key: str = ""
    
    # Frontend
    frontend_url: str = "http://localhost:3000"

    # Mercado Pago
    # Public URL used for Mercado Pago redirects (back_url). Must be externally reachable (typically https).
    # Example in local dev: an ngrok URL pointing to the frontend (port 3000).
    mp_back_url_base: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    @field_validator("database_url")
    @classmethod
    def _database_url_required(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL is required")
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore
