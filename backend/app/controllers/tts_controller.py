from fastapi import APIRouter, HTTPException
from app.schemas.tts_schemas import TtsRequest, TtsResponse, VoicesGetResponse
from app.services.tts_service import TtsService

router = APIRouter(prefix="/tts", tags=["tts"])
service = TtsService()


@router.get("/voices", response_model=VoicesGetResponse)
async def get_voices():
    """获取音色列表"""
    try:
        return await service.get_voices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=TtsResponse)
async def tts(request: TtsRequest):
    """文字转语音合成"""
    try:
        return await service.tts(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
