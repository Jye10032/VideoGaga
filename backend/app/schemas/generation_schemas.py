from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class GenerationRequest(BaseModel):
    """通用生成请求"""
    user_id: str
    project_id: str
    node_type: int  # 0:场景图, 1:人物三视图, 2:人物全身照, 3:道具图
    task_input: str  # 生成提示词


class GenerationResponse(BaseModel):
    """通用生成响应"""
    task_id: str


class GenerationTaskDetail(BaseModel):
    """任务详情"""
    id: str
    user_id: str
    project_id: str
    node_type: int
    task_id: str
    baidu_task_id: str | None = None
    task_status: Literal["pending", "running", "success", "error"]
    task_input: str | None = None
    task_output: dict | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskStatusResponse(BaseModel):
    """任务状态查询响应"""
    task_id: str
    task_status: str
    task_output: dict | None = None
