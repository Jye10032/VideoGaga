import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.models.project import Project
from app.models.script import Script
from app.models.scene import Scene
from app.schemas.comic_schemas import (
    CreateProjectRequest,
    SetConfigRequest,
    GenerateScriptRequest,
)


class ComicService:
    """漫剧工作流服务"""

    async def create_project(
        self, user_id: str, request: CreateProjectRequest, db: AsyncSession
    ) -> Project:
        """步骤1：创建项目"""
        project = Project(
            user_id=user_id,
            name=request.title,
            description=request.description,
            current_step=1,
            status="CREATED",
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    async def set_config(
        self, project_id: str, user_id: str, request: SetConfigRequest, db: AsyncSession
    ) -> Project:
        """步骤2：设置配置"""
        project = await self._get_project(project_id, user_id, db)

        # 验证步骤顺序
        if project.current_step != 1:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid step: expected step 1, current step is {project.current_step}"
            )

        # 更新配置
        config = request.config
        project.aspect_ratio = config.aspect_ratio
        project.creation_mode = config.creation_mode
        project.script_mode = config.script_mode
        # TODO: 处理 style，可能需要查找或创建 Style 记录
        # project.style_id = ...

        project.current_step = 2
        project.status = "CONFIGURED"
        await db.commit()
        await db.refresh(project)
        return project

    async def generate_script(
        self, project_id: str, user_id: str, request: GenerateScriptRequest, db: AsyncSession
    ) -> tuple[Project, str]:
        """步骤3：生成剧本（异步）"""
        project = await self._get_project(project_id, user_id, db)

        # 验证步骤顺序
        if project.current_step != 2:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid step: expected step 2, current step is {project.current_step}"
            )

        # 创建 Script 记录保存原始内容
        script = Script(
            project_id=project.id,
            original_content=request.original_content or "",
        )
        db.add(script)

        # 更新状态为生成中
        project.current_step = 3
        project.status = "GENERATING"
        await db.commit()

        # 启动异步生成任务
        task_id = f"comic_script_{project.id}"
        asyncio.create_task(self._generate_script_async(project.id))

        return project, task_id

    async def _generate_script_async(self, project_id: str):
        """异步生成剧本（后台任务）"""
        from app.core.database import AsyncSessionLocal

        try:
            # TODO: 这里暂时使用 Mock 数据，后续接入真实 AI API
            await asyncio.sleep(3)  # 模拟 AI 处理时间

            # Mock 生成结果
            mock_result = {
                "processed_content": "这是AI处理后的剧本内容...",
                "dialogues": [
                    {"id": "d1", "content": "你好，世界！", "character": "主角"},
                    {"id": "d2", "content": "欢迎来到漫剧世界", "character": "旁白"},
                ],
                "extracted_scenes": [
                    {"id": "s1", "name": "场景1", "description": "城市街道，白天", "prompt": "城市街道，白天，阳光明媚"},
                    {"id": "s2", "name": "场景2", "description": "咖啡厅内部，下午", "prompt": "咖啡厅内部，下午，温馨氛围"},
                ],
                "extracted_characters": [
                    {"id": "c1", "name": "主角", "description": "年轻的冒险家"},
                    {"id": "c2", "name": "导师", "description": "智慧的老者"},
                ],
                "extracted_props": [
                    {"id": "p1", "name": "魔法书", "description": "古老的魔法典籍"},
                    {"id": "p2", "name": "咖啡杯", "description": "普通的陶瓷杯"},
                ],
            }

            # 创建新的数据库会话
            async with AsyncSessionLocal() as db:
                # 更新 Script
                result = await db.execute(
                    select(Script).where(Script.project_id == project_id)
                )
                script = result.scalar_one_or_none()
                if script:
                    script.processed_content = mock_result["processed_content"]
                    script.dialogues = mock_result["dialogues"]
                    script.extracted_characters = mock_result["extracted_characters"]
                    script.extracted_props = mock_result["extracted_props"]

                # 创建 Scene 记录
                for scene_data in mock_result["extracted_scenes"]:
                    scene = Scene(
                        project_id=project_id,
                        name=scene_data["name"],
                        description=scene_data["description"],
                        prompt=scene_data["prompt"],
                        status="completed",
                    )
                    db.add(scene)

                # 更新 Project 状态
                result = await db.execute(
                    select(Project).where(Project.id == project_id)
                )
                project = result.scalar_one_or_none()
                if project:
                    project.status = "COMPLETED"

                await db.commit()

        except Exception as e:
            # 错误处理
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Project).where(Project.id == project_id)
                )
                project = result.scalar_one_or_none()
                if project:
                    project.status = "FAILED"
                    project.error_message = str(e)
                    await db.commit()

    async def get_project(
        self, project_id: str, user_id: str, db: AsyncSession
    ) -> Project:
        """获取项目详情（包含关联数据）"""
        result = await db.execute(
            select(Project)
            .options(
                selectinload(Project.script),
                selectinload(Project.scenes),
                selectinload(Project.style),
            )
            .where(
                Project.id == project_id,
                Project.user_id == user_id,
                Project.deleted_at.is_(None)
            )
        )
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project

    async def list_projects(
        self, user_id: str, db: AsyncSession, limit: int = 20, offset: int = 0
    ) -> tuple[int, list[Project]]:
        """获取项目列表"""
        # 查询总数
        count_result = await db.execute(
            select(func.count())
            .select_from(Project)
            .where(
                Project.user_id == user_id,
                Project.deleted_at.is_(None)
            )
        )
        total = count_result.scalar()

        # 查询数据
        result = await db.execute(
            select(Project)
            .where(
                Project.user_id == user_id,
                Project.deleted_at.is_(None)
            )
            .order_by(Project.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        projects = result.scalars().all()

        return total, projects

    async def _get_project(
        self, project_id: str, user_id: str, db: AsyncSession
    ) -> Project:
        """内部方法：获取项目并验证权限"""
        result = await db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == user_id,
                Project.deleted_at.is_(None)
            )
        )
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
