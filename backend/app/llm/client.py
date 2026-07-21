from functools import lru_cache
from openai import AsyncOpenAI
from app.config.settings import get_settings


@lru_cache
def get_llm_client() -> AsyncOpenAI:
    """创建并缓存 AsyncOpenAI 客户端（指向 OpenRouter）"""
    settings = get_settings()
    return AsyncOpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_api_host,
    )
