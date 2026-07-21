import uuid
import httpx
from app.core.auth import BaiduAuth
from app.config import get_settings
from app.schemas.task_schemas import TaskDetail


class TaskService:
    """百度 BCE 任务查询服务"""

    def __init__(self):
        settings = get_settings()
        self.host = settings.baidu_host
        self.auth = BaiduAuth(settings.baidu_ak, settings.baidu_sk, self.host)

    async def get_task(self, task_id: str) -> TaskDetail:
        path = f"/v2/tasks/{task_id}"
        request_id = str(uuid.uuid4())
        headers = self.auth.get_headers("GET", path, request_id)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{self.host}{path}",
                headers=headers,
                timeout=60
            )

        return TaskDetail(**response.json())
