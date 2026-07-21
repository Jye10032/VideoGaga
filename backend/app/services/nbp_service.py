import uuid
import httpx
from fastapi import HTTPException
from app.core.auth import BaiduAuth
from app.config import get_settings
from app.schemas.nbp_schemas import GenerateImageRequest, GenerateImageResponse


class AIGCService:
    """AIGC 图像生成服务"""

    def __init__(self):
        settings = get_settings()
        self.host = settings.baidu_host
        self.auth = BaiduAuth(settings.baidu_ak, settings.baidu_sk, self.host)
        self.api_path = "/v2/aigc/image"

    def _build_request_body(self, request: GenerateImageRequest) -> dict:
        messages = []
        for msg in request.messages:
            content = []
            for c in msg.content:
                item = {"type": c.type}
                if c.type == "text":
                    item["text"] = c.text
                elif c.type == "image_url" and c.image_item:
                    image_item = {}
                    if c.image_item.image_key:
                        image_item["imageKey"] = c.image_item.image_key
                    if c.image_item.image_url:
                        image_item["image_url"] = c.image_item.image_url
                    item["image_item"] = image_item
                content.append(item)
            messages.append({"role": msg.role, "content": content})

        body = {
            "model": request.model,
            "messages": messages,
            "size": request.size,
        }

        if request.quality:
            body["quality"] = request.quality
        if request.n and request.n > 1:
            body["n"] = request.n

        return body

    async def generate_image(self, request: GenerateImageRequest) -> GenerateImageResponse:
        request_id = str(uuid.uuid4())
        headers = self.auth.get_headers("POST", self.api_path, request_id)
        body = self._build_request_body(request)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://{self.host}{self.api_path}",
                    headers=headers,
                    json=body,
                    timeout=60
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"百度 API 错误: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"请求百度 API 失败: {str(e)}")

        return GenerateImageResponse(taskId=data["taskId"])
