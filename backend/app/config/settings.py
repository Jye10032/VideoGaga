from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Baidu BCE
    baidu_ak: str = ""
    baidu_sk: str = ""
    baidu_host: str = "vod.bj.baidubce.com"

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""  # e.g. https://pub-xxx.r2.dev or custom domain

    # Database
    database_url: str = ""

    # JWT
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # Suno API
    suno_api_key: str = ""
    suno_api_host: str = "api.sunoapi.org"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    # Backend callback URI registered in Google Console, e.g.
    # https://api.videogaga.cc/api/v1/auth/google/callback
    google_oauth_callback_url: str = ""
    # Comma-separated allowed frontend origins for redirect_uri validation
    # e.g. http://localhost:3000,https://videogaga-production.up.railway.app
    google_oauth_allowed_origins: str = (
        "http://localhost:3000,"
        "https://videogaga.cc,"
        "https://www.videogaga.cc,"
        "https://frontend-production-6914.up.railway.app,"
        "https://videogaga-production.up.railway.app"
    )

    # OpenRouter API
    openrouter_api_key: str = ""
    openrouter_api_host: str = "https://openrouter.ai/api/v1"
    openrouter_default_model: str = "google/gemini-3.1-pro-preview"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
