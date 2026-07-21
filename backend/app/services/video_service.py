import uuid
import httpx
from app.core.auth import BaiduAuth
from app.config import get_settings
from app.schemas.video_schemas import (
    ImageToVideoRequest,
    TextToVideoRequest,
    VideoGenerateResponse,
)


def to_camel_case(snake_str: str) -> str:
    """snake_case 转 camelCase"""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def convert_keys_to_camel(data: dict) -> dict:
    """递归转换字典的 key 为 camelCase"""
    if not isinstance(data, dict):
        return data
    result = {}
    for key, value in data.items():
        camel_key = to_camel_case(key)
        if isinstance(value, dict):
            result[camel_key] = convert_keys_to_camel(value)
        elif isinstance(value, list):
            result[camel_key] = [
                convert_keys_to_camel(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            result[camel_key] = value
    return result


# 模型到 TaskInput key 的映射
IMAGE_TO_VIDEO_MODEL_MAP = {
    "H23": "modelH23TaskInput",
    "H23F": "modelH23FTaskInput",
    "V10": "modelV10TaskInput",
    "V15": "modelV15TaskInput",
    "V20": "modelV20TaskInput",
    "VQ1": "modelVQ1TaskInput",
    "VQ1C": "modelVQ1CTaskInput",
    "VQ2": "modelVQ2TaskInput",
    "VQ2P": "modelVQ2PTaskInput",
    "VQ2T": "modelVQ2TTaskInput",
    "K16": "modelK16TaskInput",
    "K20": "modelK20TaskInput",
    "K21": "modelK21TaskInput",
    "K21M": "modelK21MTaskInput",
    "K25T": "modelK25TTaskInput",
    "K26": "modelK26TaskInput",
    "P35": "modelP35TaskInput",
    "P40": "modelP40TaskInput",
    "P45": "modelP45TaskInput",
    "P50": "modelP50TaskInput",
    "P55": "modelP55TaskInput",
}

TEXT_TO_VIDEO_MODEL_MAP = {
    "VQ1": "modelVQ1TaskInput",
    "VQ2": "modelVQ2TaskInput",
    "K16": "modelK16TaskInput",
    "K20": "modelK20TaskInput",
    "K21M": "modelK21MTaskInput",
    "K25T": "modelK25TTaskInput",
    "K26": "modelK26TaskInput",
    "P35": "modelP35TaskInput",
    "P40": "modelP40TaskInput",
    "P45": "modelP45TaskInput",
    "P50": "modelP50TaskInput",
}


class VideoService:
    """视频生成服务"""

    def __init__(self):
        settings = get_settings()
        self.host = settings.baidu_host
        self.auth = BaiduAuth(settings.baidu_ak, settings.baidu_sk, self.host)
        self.image_to_video_path = "/v2/aigc/image_to_video"
        self.text_to_video_path = "/v2/aigc/text_to_video"

    def _build_image_to_video_body(self, request: ImageToVideoRequest) -> dict:
        """构建图生视频请求体"""
        body = {"model": request.model}
        task_input_key = IMAGE_TO_VIDEO_MODEL_MAP.get(request.model)
        attr_name = f"model_{request.model.lower()}_task_input"
        task_input = getattr(request, attr_name, None)
        if task_input and task_input_key:
            body[task_input_key] = convert_keys_to_camel(task_input.model_dump(exclude_none=True))
        return body

    def _build_text_to_video_body(self, request: TextToVideoRequest) -> dict:
        """构建文生视频请求体"""
        body = {"model": request.model}
        task_input_key = TEXT_TO_VIDEO_MODEL_MAP.get(request.model)
        attr_name = f"model_{request.model.lower()}_task_input"
        task_input = getattr(request, attr_name, None)
        if task_input and task_input_key:
            body[task_input_key] = convert_keys_to_camel(task_input.model_dump(exclude_none=True))
        return body

    async def image_to_video(self, request: ImageToVideoRequest) -> VideoGenerateResponse:
        """图生视频"""
        request_id = str(uuid.uuid4())
        headers = self.auth.get_headers("POST", self.image_to_video_path, request_id)
        body = self._build_image_to_video_body(request)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{self.host}{self.image_to_video_path}",
                headers=headers,
                json=body,
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()

        return VideoGenerateResponse(task_id=data["taskId"])

    async def text_to_video(self, request: TextToVideoRequest) -> VideoGenerateResponse:
        """文生视频"""
        request_id = str(uuid.uuid4())
        headers = self.auth.get_headers("POST", self.text_to_video_path, request_id)
        body = self._build_text_to_video_body(request)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{self.host}{self.text_to_video_path}",
                headers=headers,
                json=body,
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()

        return VideoGenerateResponse(task_id=data["taskId"])
