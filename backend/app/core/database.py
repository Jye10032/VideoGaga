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
    # Create SSL context that doesn't verify certificates (for Railway self-signed certs)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print(f"Connecting to database: {db_url[:30]}...")
    engine = create_async_engine(
        db_url,
        echo=False,
        connect_args={"timeout": 10, "ssl": ssl_context},
        pool_pre_ping=True,
    )
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    if AsyncSessionLocal is None:
        init_db()
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not configured")
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    if engine is None:
        init_db()
    if engine:
        # Import all models to register them with Base.metadata
        from app.models.user import User
        from app.models.invite_code import InviteCode
        from app.models.task_record import TaskRecord
        from app.models.project import Project
        from app.models.style import Style
        from app.models.script import Script
        from app.models.scene import Scene
        from app.models.generation_task import GenerationTask

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        # Create initial admin invite code if not exists
        await create_initial_invite_code()


async def create_initial_invite_code():
    """Create initial admin invite code if none exists"""
    from app.models.invite_code import InviteCode

    if AsyncSessionLocal is None:
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(InviteCode).limit(1))
        if result.scalar_one_or_none() is None:
            code = InviteCode(
                code="a1bxB0c41FDHPd1",
                is_admin_code=True,
                max_uses=10,
                used_count=0
            )
            session.add(code)
            await session.commit()
            print("Initial admin invite code created: a1bxB0c41FDHPd1")
