from fastapi import APIRouter, HTTPException
from app.schemas.compose_schemas import MediaComposeRequest, MediaComposeResponse
from app.services.compose_service import ComposeService

router = APIRouter(prefix="/compose", tags=["compose"])
service = ComposeService()


@router.post("", response_model=MediaComposeResponse)
async def create_compose_task(request: MediaComposeRequest):
    """创建视频云剪辑任务"""
    try:
        return await service.create_compose_task(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
