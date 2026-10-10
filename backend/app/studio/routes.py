from datetime import datetime, timedelta
import json
import asyncio
from weakref import WeakValueDictionary
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import select, update, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.studio.models import StudioDocument, StudioRun
from app.studio.schemas import (
    NewProject,
    SaveDocument,
    StudioData,
    GenerateRequest,
    Provider,
)
from app.studio import providers
from app.studio.network import public_request

router = APIRouter(prefix="/studio", tags=["Studio"])
_submit_locks = WeakValueDictionary()


async def owned(project_id: str, user: User, db: AsyncSession):
    project = await db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id,
            Project.deleted_at.is_(None),
        )
    )
    if project is None:
        raise HTTPException(404, "项目不存在")
    return project


def summary(project):
    return {
        "id": project.id,
        "name": project.name,
        "updatedAt": project.updated_at.isoformat() + "Z",
        "mode": "connected",
    }


@router.get("/projects")
async def projects(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    rows = (
        await db.scalars(
            select(Project)
            .where(Project.user_id == user.id, Project.deleted_at.is_(None))
            .order_by(Project.updated_at.desc())
            .limit(200)
        )
    ).all()
    return [summary(row) for row in rows]


@router.post("/projects")
async def create(
    req: NewProject,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not req.name.strip():
        raise HTTPException(422, "请输入项目名称")
    row = Project(id=str(uuid4()), user_id=user.id, name=req.name.strip())
    db.add(row)
    await db.flush()
    data = StudioData().model_dump()
    db.add(StudioDocument(project_id=row.id, data=data, revision=0))
    await db.commit()
    return {**summary(row), "revision": 0, "data": data}


@router.get("/projects/{project_id}")
async def get(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await owned(project_id, user, db)
    doc = await db.get(StudioDocument, project_id)
    if not doc:
        # Preserve original legacy script rather than replacing it with demo content.
        from app.models.script import Script

        script = await db.scalar(select(Script).where(Script.project_id == project_id))
        data = StudioData(
            script=(script.original_content or "") if script else ""
        ).model_dump()
        doc = StudioDocument(project_id=project_id, data=data, revision=0)
        db.add(doc)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            doc = await db.get(StudioDocument, project_id)
            project = await owned(project_id, user, db)
    return {**summary(project), "revision": doc.revision, "data": doc.data}


@router.put("/projects/{project_id}")
async def save(
    project_id: str,
    req: SaveDocument,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await owned(project_id, user, db)
    if not req.name.strip():
        raise HTTPException(422, "请输入项目名称")
    data = req.data.model_dump()
    if len(json.dumps(data).encode()) > 24_000_000:
        raise HTTPException(413, "项目图片过大，请压缩后上传")
    asset_ids = {a.id for a in req.data.assets}
    if len(asset_ids) != len(req.data.assets) or len(
        {s.id for s in req.data.shots}
    ) != len(req.data.shots):
        raise HTTPException(422, "资产或分镜 ID 重复")
    if any(set(s.assetIds) - asset_ids for s in req.data.shots):
        raise HTTPException(422, "分镜引用了不存在的资产")
    result = await db.execute(
        update(StudioDocument)
        .where(
            StudioDocument.project_id == project_id,
            StudioDocument.revision == req.revision,
        )
        .values(data=data, revision=req.revision + 1)
    )
    if result.rowcount != 1:
        await db.rollback()
        raise HTTPException(409, "项目已在其他窗口更新，请先导出当前草稿，再刷新页面")
    project.name = req.name.strip()
    project.updated_at = datetime.utcnow()
    project.current_step = (
        7
        if req.data.shots and all(s.video for s in req.data.shots)
        else 4
        if req.data.shots
        else 3
        if req.data.assets
        else 2
    )
    project.status = "CONFIGURED"
    await db.commit()
    return {
        "revision": req.revision + 1,
        "updatedAt": project.updated_at.isoformat() + "Z",
    }


@router.delete("/projects/{project_id}")
async def remove(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await owned(project_id, user, db)
    project.deleted_at = datetime.utcnow()
    await db.commit()
    return {"ok": True}


def run_result(run):
    return {
        "id": run.id,
        "kind": run.kind,
        "targetId": run.target_id,
        "status": run.status,
        "sourceHash": run.source_hash,
        "output": run.output,
        "createdAt": run.created_at.isoformat() + "Z",
    }


@router.get("/projects/{project_id}/runs")
async def runs(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await owned(project_id, user, db)
    # A request that lost its process cannot complete without its ephemeral credentials.
    await db.execute(
        update(StudioRun)
        .where(
            StudioRun.project_id == project_id,
            StudioRun.status == "running",
            StudioRun.created_at < datetime.utcnow() - timedelta(minutes=5),
        )
        .values(
            status="uncertain",
            output={"error": "请求已中断，供应商可能仍在处理，请先核对供应商记录"},
        )
    )
    await db.commit()
    recent = (
        select(StudioRun.id)
        .where(StudioRun.project_id == project_id)
        .order_by(StudioRun.created_at.desc())
        .limit(100)
    )
    rows = (
        await db.scalars(
            select(StudioRun)
            .where(
                StudioRun.project_id == project_id,
                or_(
                    StudioRun.id.in_(recent),
                    StudioRun.status.in_(["running", "pending", "uncertain"]),
                ),
            )
            .order_by(StudioRun.created_at.desc())
        )
    ).all()
    return [run_result(row) for row in rows]


@router.post("/projects/{project_id}/generate")
async def generate(
    project_id: str,
    req: GenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # The process lock covers local SQLite; the row lock covers PostgreSQL workers.
    lock = _submit_locks.setdefault(project_id, asyncio.Lock())
    async with lock:
        await owned(project_id, user, db)
        await db.scalar(
            select(Project).where(Project.id == project_id).with_for_update()
        )
        existing = await db.get(StudioRun, req.requestId)
        if existing:
            if existing.project_id != project_id:
                raise HTTPException(409, "请求标识已使用")
            if (
                existing.source_hash != req.sourceHash
                or existing.kind != req.kind
                or existing.target_id != req.targetId
                or existing.provider_fingerprint != providers.fingerprint(req.provider)
            ):
                raise HTTPException(409, "重复请求的输入不一致")
            return run_result(existing)
        if not req.acknowledgeDuplicate:
            unfinished = await db.scalar(
                select(StudioRun)
                .where(
                    StudioRun.project_id == project_id,
                    StudioRun.kind == req.kind,
                    StudioRun.target_id == req.targetId,
                    StudioRun.source_hash == req.sourceHash,
                    StudioRun.status.in_(["running", "pending", "uncertain"]),
                )
                .order_by(StudioRun.created_at.desc())
            )
            if unfinished:
                return run_result(unfinished)
        run = StudioRun(
            id=req.requestId,
            project_id=project_id,
            kind=req.kind,
            target_id=req.targetId,
            status="running",
            source_hash=req.sourceHash,
            provider_fingerprint=providers.fingerprint(req.provider),
            output={},
        )
        db.add(run)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(409, "同一请求正在处理中，请查询任务状态")
    try:
        result = await providers.generate(req)
        run.output = result
        run.status = result["status"]
    except HTTPException as exc:
        run.status = "uncertain" if exc.status_code in (502, 504) else "error"
        run.output = {"error": exc.detail}
    except Exception:
        run.status = "uncertain"
        run.output = {"error": "生成请求结果不明，请先核对供应商记录"}
    await db.commit()
    return run_result(run)


@router.post("/projects/{project_id}/runs/{run_id}/poll")
async def poll(
    project_id: str,
    run_id: str,
    provider: Provider,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await owned(project_id, user, db)
    run = await db.get(StudioRun, run_id)
    if not run or run.project_id != project_id:
        raise HTTPException(404, "任务不存在")
    if (
        provider.protocol != "video-job"
        or providers.fingerprint(provider) != run.provider_fingerprint
    ):
        raise HTTPException(409, "查询须使用创建任务时的 API 地址、协议与模型")
    if run.status == "pending":
        result = await providers.poll(provider, run.output["remoteId"])
        run.status, run.output = result["status"], result
        await db.commit()
    return run_result(run)


@router.get("/projects/{project_id}/runs/{run_id}")
async def get_run(
    project_id: str,
    run_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await owned(project_id, user, db)
    run = await db.get(StudioRun, run_id)
    if not run or run.project_id != project_id:
        raise HTTPException(404, "任务不存在")
    if run.status == "running" and run.created_at < datetime.utcnow() - timedelta(
        minutes=5
    ):
        run.status = "uncertain"
        run.output = {"error": "请求已中断，供应商可能仍在处理，请先核对供应商记录"}
        await db.commit()
    return run_result(run)


class MediaRequest(BaseModel):
    url: str = Field(max_length=2000)


@router.post("/media")
async def media(req: MediaRequest, user: User = Depends(get_current_user)):
    raw, mime = await public_request(req.url, limit=80_000_000)
    if not mime.startswith(("image/", "video/", "audio/")) or "svg" in mime:
        raise HTTPException(422, "该地址没有返回支持的媒体文件")
    return Response(
        raw,
        media_type=mime,
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )
