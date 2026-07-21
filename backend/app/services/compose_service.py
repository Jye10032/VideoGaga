import uuid
import httpx
from app.core.auth import BaiduAuth
from app.config import get_settings
from app.schemas.compose_schemas import MediaComposeRequest, MediaComposeResponse


class ComposeService:
    """百度视频云剪辑服务"""

    def __init__(self):
        settings = get_settings()
        self.host = settings.baidu_host
        self.auth = BaiduAuth(settings.baidu_ak, settings.baidu_sk, self.host)
        self.api_path = "/v2/media_compose"

    async def create_compose_task(
        self, request: MediaComposeRequest
    ) -> MediaComposeResponse:
        """创建视频云剪辑任务"""
        request_id = str(uuid.uuid4())
        headers = self.auth.get_headers("POST", self.api_path, request_id)

        body = request.model_dump(by_alias=True, exclude_none=True)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{self.host}{self.api_path}",
                headers=headers,
                json=body,
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()

        return MediaComposeResponse(task_id=data["taskId"])
