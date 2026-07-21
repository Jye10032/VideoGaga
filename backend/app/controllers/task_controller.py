from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.schemas.task_schemas import TaskDetail
from app.services.task_service import TaskService
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.task_record import TaskRecord

router = APIRouter(prefix="/tasks", tags=["Tasks"])
service = TaskService()


@router.get("/{task_id}", response_model=TaskDetail)
async def get_task(task_id: str):
    """查询任务详情"""
    return await service.get_task(task_id)


@router.get("/user/history")
async def get_user_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(5, ge=1, le=50),
    offset: int = Query(0, ge=0),
    task_type: str | None = Query(None),
):
    """获取用户任务历史（分页，最新的在前，返回所有状态）"""
    # 构建基础查询条件
    base_condition = TaskRecord.user_id == user.id
    if task_type:
        base_condition = (TaskRecord.user_id == user.id) & (TaskRecord.task_type == task_type)

    # 查询总数
    count_result = await db.execute(
        select(func.count()).select_from(TaskRecord).where(base_condition)
    )
    total = count_result.scalar()

    # 查询数据
    result = await db.execute(
        select(TaskRecord)
        .where(base_condition)
        .order_by(TaskRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    records = result.scalars().all()

    return {
        "total": total,
        "items": [
            {
                "id": r.id,
                "task_id": r.task_id,
                "task_type": r.task_type,
                "status": r.status,
                "prompt": r.prompt,
                "result_urls": r.result_urls,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ]
    }


@router.post("/user/history")
async def save_task_record(
    data: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """保存任务记录（任务提交时调用）"""
    record = TaskRecord(
        user_id=user.id,
        task_id=data.get("task_id", ""),
        task_type=data.get("task_type", "image"),
        status=data.get("status", "RUNNING"),
        prompt=data.get("prompt"),
        result_urls=data.get("result_urls"),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {"message": "Record saved", "id": record.id}


@router.put("/user/history/{task_id}")
async def update_task_record(
    task_id: str,
    data: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新任务记录状态（任务完成时调用）"""
    result = await db.execute(
        select(TaskRecord).where(
            TaskRecord.task_id == task_id,
            TaskRecord.user_id == user.id
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Task record not found")

    if "status" in data:
        record.status = data["status"]
    if "result_urls" in data:
        record.result_urls = data["result_urls"]

    await db.commit()
    return {"message": "Record updated"}
