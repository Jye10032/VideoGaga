from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import httpx
from app.schemas.image_schemas import (
    ImageUploadRequest,
    ImageUploadResponse,
)
from app.services.image_service import ImageService
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/images", tags=["Images"])
service = ImageService()


@router.post("/upload", response_model=ImageUploadResponse)
async def create_upload(request: ImageUploadRequest, user: User = Depends(get_current_user)):
    """获取图片上传URL（需要登录）"""
    return await service.create_upload(request)


@router.get("/url/{image_key:path}")
async def get_image_url(image_key: str, user: User = Depends(get_current_user)):
    """获取图片公网URL（需要登录）"""
    return {"url": service.get_public_url(image_key)}


@router.get("/download")
async def download_image(url: str, filename: str = "image.png"):
    """代理下载图片（流式传输）"""
    async def stream_content():
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("GET", url, follow_redirects=True) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    yield chunk

    return StreamingResponse(
        stream_content(),
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
