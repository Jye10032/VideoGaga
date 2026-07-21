from fastapi import APIRouter, Depends
from app.schemas.nbp_schemas import GenerateImageRequest, GenerateImageResponse
from app.services.nbp_service import AIGCService
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/aigc", tags=["AIGC"])
service = AIGCService()


@router.post("/image", response_model=GenerateImageResponse)
async def generate_image(request: GenerateImageRequest, user: User = Depends(get_current_user)):
    """生成图像（需要登录）"""
    return await service.generate_image(request)
