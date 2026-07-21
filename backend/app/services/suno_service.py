import httpx
from app.config import get_settings
from app.schemas.suno_schemas import (
    SunoGenerateRequest,
    SunoGenerateResponse,
    SunoRecordInfoResponse,
)


class SunoService:
    """Suno 音乐生成服务"""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.suno_api_key
        self.host = settings.suno_api_host
        self.generate_path = "/api/v1/generate"

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _build_request_body(self, request: SunoGenerateRequest) -> dict:
        body = {
            "customMode": request.custom_mode,
            "instrumental": request.instrumental,
            "model": request.model,
            "callBackUrl": request.callback_url or "",
        }
        if request.prompt:
            body["prompt"] = request.prompt
        if request.style:
            body["style"] = request.style
        if request.title:
            body["title"] = request.title
        if request.persona_id:
            body["personaId"] = request.persona_id
        if request.negative_tags:
            body["negativeTags"] = request.negative_tags
        if request.vocal_gender:
            body["vocalGender"] = request.vocal_gender
        if request.style_weight is not None:
            body["styleWeight"] = request.style_weight
        if request.weirdness_constraint is not None:
            body["weirdnessConstraint"] = request.weirdness_constraint
        if request.audio_weight is not None:
            body["audioWeight"] = request.audio_weight
        return body

    async def generate_music(self, request: SunoGenerateRequest) -> SunoGenerateResponse:
        """生成音乐"""
        headers = self._get_headers()
        body = self._build_request_body(request)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{self.host}{self.generate_path}",
                headers=headers,
                json=body,
                timeout=60,
            )
            data = response.json()

        return SunoGenerateResponse(**data)

    async def get_record_info(self, task_id: str) -> SunoRecordInfoResponse:
        """获取音乐生成详情"""
        headers = self._get_headers()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{self.host}/api/v1/generate/record-info",
                headers=headers,
                params={"taskId": task_id},
                timeout=30,
            )
            data = response.json()

        return SunoRecordInfoResponse(**data)
