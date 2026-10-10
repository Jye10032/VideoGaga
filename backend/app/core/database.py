import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select
from app.config.settings import get_settings


class Base(DeclarativeBase):
    pass


engine = None
AsyncSessionLocal = None


def init_db():
    global engine, AsyncSessionLocal
    settings = get_settings()
    db_url = settings.database_url
    if not db_url:
        print("WARNING: DATABASE_URL not configured, database features disabled")
        return
    # Convert postgresql:// to postgresql+asyncpg:// for async support
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    connect_args = {}
    if db_url.startswith("postgresql+asyncpg:"):
        # Private-network development may opt out; TLS certificates are verified by default.
        connect_args = {"timeout": 10}
        if settings.database_ssl_mode != "disable":
            connect_args["ssl"] = ssl.create_default_context()
    engine = create_async_engine(db_url, echo=False, connect_args=connect_args, pool_pre_ping=True)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    if AsyncSessionLocal is None:
        init_db()
    if AsyncSessionLocal is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="账号服务尚未配置，可先使用本地演示")
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    if engine is None:
        init_db()
    if engine:
        # Import all models to register them with Base.metadata
        from app.models.user import User
        from app.models.oauth_identity import OAuthIdentity
        from app.models.invite_code import InviteCode
        from app.models.task_record import TaskRecord
        from app.models.project import Project
        from app.models.style import Style
        from app.models.script import Script
        from app.models.scene import Scene
        from app.models.generation_task import GenerationTask
        from app.studio.models import StudioDocument

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        # Create initial admin invite code if not exists
        await create_initial_invite_code()


async def create_initial_invite_code():
    """Opt-in bootstrap: no public/default administrator credential."""
    from app.models.invite_code import InviteCode
    from app.models.user import User
    settings = get_settings()
    code_value = settings.bootstrap_admin_invite
    if AsyncSessionLocal is None:
        return
    async with AsyncSessionLocal() as session:
        # Revoke the previously published bootstrap invitation on existing installations.
        old = await session.scalar(select(InviteCode).where(InviteCode.code == "a1bxB0c41FDHPd1"))
        if old:
            from datetime import datetime
            old.expires_at = datetime.utcnow()
        has_admin = await session.scalar(select(User.id).where(User.role == "admin").limit(1))
        if code_value and not has_admin:
            if not 16 <= len(code_value) <= 32:
                raise RuntimeError("BOOTSTRAP_ADMIN_INVITE must be 16 to 32 characters")
            existing = await session.scalar(select(InviteCode).where(InviteCode.code == code_value))
            if not existing:
                session.add(InviteCode(code=code_value, is_admin_code=True, max_uses=1, used_count=0))
        await session.commit()
