from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.generation_schemas import (
    GenerationRequest,
    GenerationResponse,
    TaskStatusResponse,
)
from app.services.generation_service import GenerationService

router = APIRouter(prefix="/generation", tags=["Generation"])


@router.post("/create", response_model=GenerationResponse)
async def create_generation_task(
    request: GenerationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    创建通用生成任务

    - **user_id**: 用户ID
    - **project_id**: 项目ID
    - **node_type**: 节点类型 (0:场景图, 1:人物三视图, 2:人物全身照, 3:道具图)
    - **task_input**: 生成提示词
    """
    if request.node_type not in [0, 1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid node_type. Must be 0, 1, 2, or 3")

    service = GenerationService()
    return await service.create_generation_task(request, db)


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    查询生成任务状态

    - **task_id**: 任务ID
    """
    service = GenerationService()
    task = await service.get_task_status(task_id, db)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskStatusResponse(
        task_id=task.task_id,
        task_status=task.task_status,
        task_output=task.task_output,
    )
