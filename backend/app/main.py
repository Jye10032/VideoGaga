from contextlib import asynccontextmanager
import time
import httpx
from fastapi import FastAPI, Request, HTTPException
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
from app.core.database import create_tables, init_db
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    await create_tables()
    yield


app = FastAPI(title="Video Gaga Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://videogaga.cc",
        "https://www.videogaga.cc",
        "https://frontend-production-6914.up.railway.app",
        "https://videogaga-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(nbp_router, prefix="/api/v1")
app.include_router(task_router, prefix="/api/v1")
# app.include_router(image_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(video_router)
app.include_router(tts_router, prefix="/api/v1")
app.include_router(compose_router, prefix="/api/v1")
app.include_router(suno_router)
app.include_router(comic_router, prefix="/api/v1")
app.include_router(generation_router, prefix="/api/v1")

# 允许的域名列表（用于 CORS）
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://videogaga.cc",
    "https://www.videogaga.cc",
    "https://frontend-production-6914.up.railway.app",
    "https://videogaga-production.up.railway.app",
]


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
        headers=get_cors_headers(request),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器，确保错误响应也包含 CORS 头"""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers=get_cors_headers(request),
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/debug/db")
async def debug_db():
    from app.core.database import AsyncSessionLocal, engine
    from sqlalchemy import text
    if not engine:
        return {"error": "No engine"}
    if not AsyncSessionLocal:
        return {"error": "No session"}
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            return {"tables": tables}
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/baidu")
async def debug_baidu():
    """Check outbound connectivity to Baidu VOD."""
    settings = get_settings()
    host = settings.baidu_host or "vod.bj.baidubce.com"
    url = f"https://{host}"
    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.head(url, follow_redirects=True)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": True,
            "url": url,
            "status_code": response.status_code,
            "elapsed_ms": elapsed_ms,
        }
    except Exception as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": False,
            "url": url,
            "elapsed_ms": elapsed_ms,
            "error": str(exc),
        }


@app.get("/debug/config")
async def debug_config():
    """Print all configuration to console and return as JSON."""
    settings = get_settings()
    config_info = {
        "Baidu BCE": {
            "ak": "***" if settings.baidu_ak else "NOT SET",
            "sk": "***" if settings.baidu_sk else "NOT SET",
            "host": settings.baidu_host,
        },
        "Cloudflare R2": {
            "account_id": settings.r2_account_id if settings.r2_account_id else "NOT SET",
            "access_key_id": "***" if settings.r2_access_key_id else "NOT SET",
            "secret_access_key": "***" if settings.r2_secret_access_key else "NOT SET",
            "bucket_name": settings.r2_bucket_name if settings.r2_bucket_name else "NOT SET",
            "public_url": settings.r2_public_url if settings.r2_public_url else "NOT SET",
        },
        "Database": {
            "url": "***" if settings.database_url else "NOT SET",
        },
        "JWT": {
            "secret": "***" if settings.jwt_secret else "NOT SET",
            "algorithm": settings.jwt_algorithm,
            "expire_minutes": settings.jwt_expire_minutes,
        },
        "Suno API": {
            "api_key": "***" if settings.suno_api_key else "NOT SET",
            "api_host": settings.suno_api_host,
        },
        "Google OAuth": {
            "client_id": settings.google_client_id if settings.google_client_id else "NOT SET",
            "client_secret": "***" if settings.google_client_secret else "NOT SET",
            "callback_url": settings.google_oauth_callback_url if settings.google_oauth_callback_url else "NOT SET",
        },
        "OpenRouter API": {
            "api_key": "***" if settings.openrouter_api_key else "NOT SET",
            "api_host": settings.openrouter_api_host,
        },
    }

    # Print to console
    print("\n" + "="*60)
    print("CONFIGURATION SUMMARY")
    print("="*60)
    for section, values in config_info.items():
        print(f"\n{section}:")
        for key, value in values.items():
            print(f"  {key}: {value}")
    print("\n" + "="*60 + "\n")

    return config_info
