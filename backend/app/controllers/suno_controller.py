from fastapi import APIRouter, HTTPException
from app.schemas.suno_schemas import (
    SunoGenerateRequest,
    SunoGenerateResponse,
    SunoCallbackRequest,
    SunoCallbackResponse,
    SunoRecordInfoResponse,
)
from app.services.suno_service import SunoService

router = APIRouter(prefix="/api/v1/suno", tags=["suno"])

suno_service = SunoService()


@router.post("/generate", response_model=SunoGenerateResponse)
async def generate_music(request: SunoGenerateRequest):
    """生成音乐"""
    try:
        return await suno_service.generate_music(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/callback", response_model=SunoCallbackResponse)
async def handle_callback(request: SunoCallbackRequest):
    """接收 Suno API 回调"""
    task_id = request.data.task_id
    callback_type = request.data.callback_type

    if request.code == 200:
        music_list = request.data.data or []
        print(f"任务 {task_id} 回调: {callback_type}, 生成 {len(music_list)} 首音乐")
    else:
        print(f"任务 {task_id} 失败: {request.msg}")

    return SunoCallbackResponse()


@router.get("/record/{task_id}", response_model=SunoRecordInfoResponse)
async def get_record_info(task_id: str):
    """获取音乐生成详情"""
    try:
        return await suno_service.get_record_info(task_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
