from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.comic_schemas import (
    CreateProjectRequest,
    CreateProjectResponse,
    SetConfigRequest,
    SetConfigResponse,
    GenerateScriptRequest,
    GenerateScriptResponse,
    ProjectDetail,
    ProjectListResponse,
    ProjectListItem,
)
from app.services.comic_service import ComicService
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User


router = APIRouter(prefix="/comic", tags=["Comic"])
service = ComicService()


@router.post("/projects", response_model=CreateProjectResponse)
async def create_project(
    request: CreateProjectRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """步骤1：创建漫剧项目"""
    project = await service.create_project(user.id, request, db)
    return CreateProjectResponse(project_id=project.id)


@router.put("/projects/{project_id}/config", response_model=SetConfigResponse)
async def set_config(
    project_id: str,
    request: SetConfigRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """步骤2：设置项目配置"""
    project = await service.set_config(project_id, user.id, request, db)
    return SetConfigResponse(project_id=project.id)


@router.post("/projects/{project_id}/generate", response_model=GenerateScriptResponse)
async def generate_script(
    project_id: str,
    request: GenerateScriptRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """步骤3：生成剧本和场景（异步）"""
    raise HTTPException(410, "旧剧本生成接口已停用，请使用创作工作台")


@router.get("/projects/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取项目详情（用于轮询查询生成状态）"""
    project = await service.get_project(project_id, user.id, db)
    return project


@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """获取用户的项目列表"""
    total, projects = await service.list_projects(user.id, db, limit, offset)
    return ProjectListResponse(
        total=total,
        items=[
            ProjectListItem(
                id=p.id,
                name=p.name,
                description=p.description,
                current_step=p.current_step,
                status=p.status,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in projects
        ],
    )

