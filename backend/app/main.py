from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.controllers import nbp_router
from app.controllers.task_controller import router as task_router
# from app.controllers.image_controller import router as image_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.admin_controller import router as admin_router
from app.controllers.video_controller import router as video_router
from app.controllers.tts_controller import router as tts_router
from app.controllers.compose_controller import router as compose_router
from app.controllers.suno_controller import router as suno_router
from app.controllers.comic_controller import router as comic_router
from app.controllers.generation_controller import router as generation_router
from app.core.database import create_tables, init_db, get_db
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import require_legacy_provider
from app.config import get_settings
from app.studio.routes import router as studio_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.database_url and len(settings.jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must contain at least 32 characters")
    init_db()
    await create_tables()
    yield


app = FastAPI(title="Video Gaga Backend", version="0.1.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in get_settings().cors_allowed_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(nbp_router, dependencies=[Depends(require_legacy_provider)], prefix="/api/v1")
app.include_router(task_router, dependencies=[Depends(require_legacy_provider)], prefix="/api/v1")
# app.include_router(image_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(video_router, dependencies=[Depends(require_legacy_provider)])
app.include_router(tts_router, dependencies=[Depends(require_legacy_provider)], prefix="/api/v1")
app.include_router(compose_router, dependencies=[Depends(require_legacy_provider)], prefix="/api/v1")
app.include_router(suno_router, dependencies=[Depends(require_legacy_provider)])
app.include_router(comic_router, prefix="/api/v1")
app.include_router(studio_router, prefix="/api/v1")
app.include_router(generation_router, dependencies=[Depends(require_legacy_provider)], prefix="/api/v1")

def get_cors_headers(request: Request) -> dict:
    """根据请求的 Origin 返回 CORS 头"""
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return headers


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 异常处理器，确保错误响应也包含 CORS 头"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={**get_cors_headers(request), **(exc.headers or {})},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器，确保错误响应也包含 CORS 头"""
    return JSONResponse(
        status_code=500,
        content={"detail": "服务暂时不可用，请稍后重试"},
        headers=get_cors_headers(request),
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}


from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    # Never echo request input: it can contain an ephemeral API key or password.
    return JSONResponse(status_code=422, content={"detail": "提交内容不符合要求，请检查输入", "fields": [".".join(map(str, e["loc"])) for e in exc.errors()]}, headers=get_cors_headers(request))
