from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth_schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.register(req)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(req)


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.get_me(user)


@router.get("/google/login")
async def google_login(
    redirect_uri: str = Query(..., description="Frontend callback URL"),
    next: str = Query("/", description="Frontend next path after login"),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    google_url = service.get_google_login_url(redirect_uri, next)
    return RedirectResponse(url=google_url, status_code=302)


@router.get("/google/callback")
async def google_callback(
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    frontend_url = await service.handle_google_callback(code, state, error)
    return RedirectResponse(url=frontend_url, status_code=302)
