import uuid
import httpx
from app.core.auth import BaiduAuth
from app.config import get_settings
from app.schemas.tts_schemas import TtsRequest, TtsResponse, VoicesGetResponse


class TtsService:
    """百度 BCE TTS 服务"""

    def __init__(self):
        settings = get_settings()
        self.host = settings.baidu_host
        self.auth = BaiduAuth(settings.baidu_ak, settings.baidu_sk, self.host)

    async def tts(self, request: TtsRequest) -> TtsResponse:
        """文字转语音合成"""
        path = "/v2/tts"
        request_id = str(uuid.uuid4())
        headers = self.auth.get_headers("POST", path, request_id)

        body = request.model_dump(by_alias=True, exclude_none=True)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{self.host}{path}",
                headers=headers,
                json=body,
                timeout=60
            )
            response.raise_for_status()

        return TtsResponse(url=response.text)

    async def get_voices(self) -> VoicesGetResponse:
        """获取音色列表"""
        path = "/v2/tts/voices"
        request_id = str(uuid.uuid4())
        headers = self.auth.get_headers("GET", path, request_id)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{self.host}{path}",
                headers=headers,
                timeout=60
            )
            response.raise_for_status()

        return VoicesGetResponse(**response.json())
