from pydantic import BaseModel, Field
from typing import Optional, Literal, Any
from datetime import datetime


# 配置相关
class ComicConfig(BaseModel):
    aspect_ratio: str = Field(..., description="画面比例，如 16:9, 4:3, 1:1")
    creation_mode: str = Field(..., description="创作模式")
    script_mode: str = Field(..., description="剧本模式")
    style: str = Field("", description="风格")


# 步骤1：创建项目
class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="项目标题")
    description: Optional[str] = Field(None, description="项目描述")


class CreateProjectResponse(BaseModel):
    project_id: str
    message: str = "Project created successfully"


# 步骤2：设置配置
class SetConfigRequest(BaseModel):
    config: ComicConfig


class SetConfigResponse(BaseModel):
    project_id: str
    message: str = "Configuration saved successfully"


# 步骤3：生成剧本
class GenerateScriptRequest(BaseModel):
    original_content: Optional[str] = Field(None, description="用户输入的原始剧本")


class GenerateScriptResponse(BaseModel):
    project_id: str
    task_id: str  # 用于轮询的任务ID
    message: str = "Script generation started"


# 场景详情
class SceneDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    prompt: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 剧本详情
class ScriptDetail(BaseModel):
    id: str
    original_content: str
    processed_content: Optional[str]
    dialogues: Optional[list[Any]]
    extracted_characters: Optional[list[Any]]
    extracted_props: Optional[list[Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 项目详情（新架构）
class ProjectDetail(BaseModel):
    id: str
    user_id: str
    name: str  # 改为 name（与 Project 模型一致）
    description: Optional[str]
    # 配置字段（扁平化）
    aspect_ratio: str
    creation_mode: str
    script_mode: str
    style_id: Optional[str]
    # 关联数据
    script: Optional[ScriptDetail]
    scenes: list[SceneDetail]
    # 状态
    current_step: int
    status: Literal["CREATED", "CONFIGURED", "GENERATING", "COMPLETED", "FAILED"]
    error_message: Optional[str]
    # 时间戳
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    # 兼容旧接口的属性
    @property
    def title(self) -> str:
        return self.name

    @property
    def config(self) -> dict:
        return {
            "aspect_ratio": self.aspect_ratio,
            "creation_mode": self.creation_mode,
            "script_mode": self.script_mode,
            "style": self.style_id or "",
        }

    @property
    def original_content(self) -> Optional[str]:
        return self.script.original_content if self.script else None

    @property
    def processed_content(self) -> Optional[str]:
        return self.script.processed_content if self.script else None

    @property
    def dialogues(self) -> Optional[list[Any]]:
        return self.script.dialogues if self.script else None

    @property
    def extracted_scenes(self) -> list[dict]:
        return [
            {"id": s.id, "description": s.description, "name": s.name}
            for s in self.scenes
        ]

    @property
    def extracted_characters(self) -> Optional[list[Any]]:
        return self.script.extracted_characters if self.script else None

    @property
    def extracted_props(self) -> Optional[list[Any]]:
        return self.script.extracted_props if self.script else None


# 项目列表项
class ProjectListItem(BaseModel):
    id: str
    name: str  # 改为 name
    description: Optional[str]
    current_step: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @property
    def title(self) -> str:
        return self.name


# 项目列表响应
class ProjectListResponse(BaseModel):
    total: int
    items: list[ProjectListItem]
