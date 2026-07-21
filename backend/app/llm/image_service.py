"""
OpenRouter 图像生成服务

使用 OpenRouter API 调用支持图像生成的模型（如 Gemini）
"""

import logging
import base64
import httpx
from typing import Optional
from pydantic import BaseModel

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class ImageGenerationResult(BaseModel):
    """图像生成结果"""
    images: list[str]  # base64 编码的图像列表
    text: str | None = None  # 模型返回的文本（如果有）
    model: str  # 使用的模型


class ImageGenerationService:
    """OpenRouter 图像生成服务"""

    # 支持图像生成的模型
    IMAGE_MODELS = {
        "gemini-flash": "google/gemini-3.1-flash-image-preview",
    }

    def __init__(self, model: str = "gemini-flash"):
        settings = get_settings()
        self.api_key = settings.openrouter_api_key
        self.api_host = settings.openrouter_api_host.rstrip('/')
        self.default_model = self.IMAGE_MODELS.get(model, model)

    async def generate_image(
        self,
        prompt: str,
        *,
        model: str | None = None,
        size: str = "1:1",
    ) -> ImageGenerationResult:
        """
        生成图像

        Args:
            prompt: 图像生成提示词
            model: 模型名称（可选，默认使用 gemini-flash）
            size: 图像尺寸比例（暂未使用，由模型自行决定）

        Returns:
            ImageGenerationResult: 包含 base64 图像列表的结果
        """
        use_model = model or self.default_model

        # 构建请求
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://videogaga.cc",
            "X-Title": "VideoGaGa",
        }

        payload = {
            "model": use_model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            # 请求返回图像
            "modalities": ["image", "text"],
        }

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    f"{self.api_host}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            # 解析响应
            images = []
            text = None

            if "choices" in data and data["choices"]:
                message = data["choices"][0].get("message", {})

                # 提取文本内容
                text = message.get("content")

                # 提取图像（OpenRouter 返回的图像在 message.images 中）
                if "images" in message:
                    for img in message["images"]:
                        if "image_url" in img and "url" in img["image_url"]:
                            url = img["image_url"]["url"]
                            # 如果是 base64 data URL，提取 base64 部分
                            if url.startswith("data:image"):
                                # data:image/png;base64,xxxx
                                base64_data = url.split(",", 1)[1] if "," in url else url
                                images.append(base64_data)
                            else:
                                # 如果是普通 URL，下载并转为 base64
                                images.append(url)

                # 某些模型可能在 content 中返回图像（multipart content）
                content = message.get("content")
                if isinstance(content, list):
                    for part in content:
                        if isinstance(part, dict):
                            if part.get("type") == "image_url":
                                url = part.get("image_url", {}).get("url", "")
                                if url.startswith("data:image"):
                                    base64_data = url.split(",", 1)[1] if "," in url else url
                                    images.append(base64_data)
                                elif url:
                                    images.append(url)
                            elif part.get("type") == "text":
                                text = part.get("text")

            logger.info(f"Image generation completed: model={use_model}, images_count={len(images)}")

            return ImageGenerationResult(
                images=images,
                text=text,
                model=use_model,
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter API error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            raise

    async def generate_image_url(
        self,
        prompt: str,
        **kwargs,
    ) -> list[str]:
        """
        生成图像并返回 data URL 列表

        Returns:
            list[str]: data URL 格式的图像列表
        """
        result = await self.generate_image(prompt, **kwargs)

        urls = []
        for img in result.images:
            if img.startswith("http"):
                urls.append(img)
            elif img.startswith("data:"):
                urls.append(img)
            else:
                # 假设是 base64，转换为 data URL
                urls.append(f"data:image/png;base64,{img}")

        return urls
