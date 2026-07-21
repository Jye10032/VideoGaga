from fastapi import APIRouter, HTTPException
from app.schemas.video_schemas import (
    ImageToVideoRequest,
    TextToVideoRequest,
    VideoGenerateResponse,
)
from app.services.video_service import VideoService

router = APIRouter(prefix="/api/v1/video", tags=["video"])

video_service = VideoService()


@router.post("/image_to_video", response_model=VideoGenerateResponse)
async def image_to_video(request: ImageToVideoRequest):
    """
    图生视频接口

    支持的模型:
    - H23 (海螺 2.3): 单图模式
    - H23F (海螺 2.3FAST): 单图模式
    - VQ2P (viduq2-pro): 单图/首尾帧模式
    - VQ2T (viduq2-turbo): 单图/首尾帧模式
    """
    try:
        return await video_service.image_to_video(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text_to_video", response_model=VideoGenerateResponse)
async def text_to_video(request: TextToVideoRequest):
    """
    文生视频接口

    支持的模型:
    - VQ2 (viduq2): 文本生成视频
    """
    try:
        return await video_service.text_to_video(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
