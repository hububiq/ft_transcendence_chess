from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # ---------------------------------------------------------
    # FASTAPI CORE
    # ---------------------------------------------------------
    debug: bool = Field(default=True)
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8001)

    # ---------------------------------------------------------
    # DATABASE (async PostgreSQL)
    # ---------------------------------------------------------
    database_url: str = Field(..., alias="FASTAPI_DATABASE_URL")

    # ---------------------------------------------------------
    # REDIS (Pub/Sub broker)
    # ---------------------------------------------------------
    redis_host: str = Field(default="redis_broker", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")

    # ---------------------------------------------------------
    # JWT (shared with Django)
    # ---------------------------------------------------------
    jwt_secret_key: str = Field(..., alias="FASTAPI_JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="FASTAPI_JWT_ALGORITHM")

    # ---------------------------------------------------------
    # Pydantic Settings Config
    # ---------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
