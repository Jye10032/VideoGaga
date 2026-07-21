import logging
from typing import Optional, Any
from openai import APIError, APIConnectionError, RateLimitError
from app.llm.client import get_llm_client
from app.llm.schemas import ChatMessage, ChatCompletionResponse
from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class LLMService:
    """通用 LLM 对话服务"""

    def __init__(self, model: str | None = None):
        self.client = get_llm_client()
        self.default_model = model or get_settings().openrouter_default_model

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        response_format: dict[str, Any] | None = None,
    ) -> ChatCompletionResponse:
        """通用 chat completion 接口"""
        use_model = model or self.default_model

        kwargs: dict[str, Any] = {
            "model": use_model,
            "messages": [m.model_dump() for m in messages],
            "temperature": temperature,
        }
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if response_format is not None:
            kwargs["response_format"] = response_format

        try:
            response = await self.client.chat.completions.create(**kwargs)
        except RateLimitError as e:
            logger.warning("LLM rate limited: %s", e)
            raise
        except APIConnectionError as e:
            logger.error("LLM connection error: %s", e)
            raise
        except APIError as e:
            logger.error("LLM API error [%s]: %s", e.status_code, e.message)
            raise

        choice = response.choices[0]
        usage = None
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

        return ChatCompletionResponse(
            content=choice.message.content or "",
            model=response.model,
            usage=usage,
        )

    async def chat_json(
        self,
        messages: list[ChatMessage],
        **kwargs,
    ) -> ChatCompletionResponse:
        """要求模型返回 JSON 格式的 chat completion"""
        return await self.chat(
            messages,
            response_format={"type": "json_object"},
            **kwargs,
        )
