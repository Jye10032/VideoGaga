import uuid
import asyncio
import base64
import httpx
from io import BytesIO
from PIL import Image
import boto3
from botocore.config import Config
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.generation_task import GenerationTask
from app.schemas.generation_schemas import GenerationRequest, GenerationResponse
from app.llm.image_service import ImageGenerationService


# node_type 到尺寸的映射
NODE_TYPE_SIZE_MAP = {
    0: "1:1",    # 场景图（四宫格）
    1: "1:1",    # 人物三视图
    2: "3:4",    # 人物全身照
    3: "1:1",    # 道具图
}

# node_type 名称
NODE_TYPE_NAMES = {
    0: "scene",
    1: "character_views",
    2: "character_full",
    3: "prop",
}


class GenerationService:
    """通用生成服务"""

    def __init__(self):
        settings = get_settings()
        self.image_service = ImageGenerationService()

        # R2 客户端
        self.bucket_name = settings.r2_bucket_name
        self.public_url = settings.r2_public_url.rstrip('/') if settings.r2_public_url else ""

        if settings.r2_account_id and settings.r2_access_key_id:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                config=Config(signature_version='s3v4'),
                region_name='auto'
            )
        else:
            self.s3_client = None

    async def create_generation_task(
        self,
        request: GenerationRequest,
        db: AsyncSession
    ) -> GenerationResponse:
        """创建生成任务"""
        # 1. 生成唯一的 task_id (格式: tsk-xxx)
        task_id = f"tsk-{uuid.uuid4().hex[:12]}"

        # 2. 创建数据库记录
        task = GenerationTask(
            user_id=request.user_id,
            project_id=request.project_id,
            node_type=request.node_type,
            task_id=task_id,
            task_status="pending",
            task_input=request.task_input,
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

        # 3. 启动异步任务处理
        asyncio.create_task(self._process_generation_task(task_id, request))

        # 4. 返回 task_id
        return GenerationResponse(task_id=task_id)

    async def _process_generation_task(self, task_id: str, request: GenerationRequest):
        """异步处理生成任务"""
        # 动态导入以避免初始化时 AsyncSessionLocal 为 None
        from app.core.database import AsyncSessionLocal

        if AsyncSessionLocal is None:
            print(f"[ERROR] AsyncSessionLocal is None for task {task_id}")
            return

        async with AsyncSessionLocal() as db:
            try:
                # 更新状态为 running
                await self._update_task_status(db, task_id, "running")

                # 调用 OpenRouter 图像生成接口
                size = NODE_TYPE_SIZE_MAP.get(request.node_type, "1:1")
                result = await self.image_service.generate_image(
                    prompt=request.task_input,
                    size=size,
                )

                if result.images:
                    # 处理生成的图片
                    urls = await self._process_and_upload_images(
                        result.images,
                        task_id,
                        request.node_type
                    )

                    # 更新任务状态为成功
                    await self._update_task_status(
                        db, task_id, "success",
                        task_output={"urls": urls}
                    )
                else:
                    await self._update_task_status(
                        db, task_id, "error",
                        task_output={"error": "图像生成失败：未返回图片"}
                    )

            except Exception as e:
                # 更新任务状态为失败
                await self._update_task_status(
                    db, task_id, "error",
                    task_output={"error": str(e)}
                )

    async def _process_and_upload_images(
        self,
        images: list[str],
        task_id: str,
        node_type: int
    ) -> list[str]:
        """处理并上传图片到 Cloudflare R2"""
        if not images:
            return []

        # 获取第一张图片的数据
        image_data = await self._get_image_data(images[0])

        if not self.s3_client:
            # 如果没有配置 R2，返回 data URL
            return [f"data:image/png;base64,{base64.b64encode(image_data).decode()}"]

        urls = []

        if node_type == 0:
            # 场景图：四宫格拆分
            urls = await self._split_and_upload_grid(image_data, task_id)
        else:
            # 其他类型：直接上传
            key = f"images/{task_id}/image.png"
            url = await self._upload_to_r2(image_data, key)
            urls = [url]

        return urls

    async def _get_image_data(self, image: str) -> bytes:
        """从 base64 或 URL 获取图片二进制数据"""
        if image.startswith("data:image"):
            # data URL 格式：data:image/png;base64,xxxx
            base64_data = image.split(",", 1)[1] if "," in image else image
            return base64.b64decode(base64_data)
        elif image.startswith("http"):
            # HTTP URL，下载图片
            async with httpx.AsyncClient() as client:
                response = await client.get(image, timeout=60)
                response.raise_for_status()
                return response.content
        else:
            # 纯 base64
            return base64.b64decode(image)

    async def _split_and_upload_grid(self, image_data: bytes, task_id: str) -> list[str]:
        """将四宫格图片拆分成4张并上传"""
        image = Image.open(BytesIO(image_data))
        width, height = image.size

        # 计算每个格子的尺寸
        half_width = width // 2
        half_height = height // 2

        # 拆分为4张图
        positions = [
            (0, 0, half_width, half_height),              # 左上
            (half_width, 0, width, half_height),          # 右上
            (0, half_height, half_width, height),         # 左下
            (half_width, half_height, width, height),     # 右下
        ]

        urls = []
        for i, box in enumerate(positions):
            cropped = image.crop(box)

            # 转换为 bytes
            buffer = BytesIO()
            cropped.save(buffer, format='PNG')
            buffer.seek(0)

            # 上传
            key = f"images/{task_id}/scene_{i}.png"
            url = await self._upload_to_r2(buffer.read(), key)
            urls.append(url)

        return urls

    async def _upload_to_r2(self, image_data: bytes, key: str) -> str:
        """上传图片到 Cloudflare R2"""
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=image_data,
            ContentType='image/png'
        )
        return f"{self.public_url}/{key}"

    async def _update_task_status(
        self,
        db: AsyncSession,
        task_id: str,
        status: str,
        task_output: dict | None = None
    ):
        """更新任务状态"""
        result = await db.execute(
            select(GenerationTask).where(GenerationTask.task_id == task_id)
        )
        task = result.scalar_one()
        task.task_status = status
        if task_output is not None:
            task.task_output = task_output
        await db.commit()

    async def get_task_status(self, task_id: str, db: AsyncSession):
        """查询任务状态"""
        result = await db.execute(
            select(GenerationTask).where(GenerationTask.task_id == task_id)
        )
        task = result.scalar_one_or_none()
        return task
