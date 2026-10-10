from fastapi import APIRouter, Depends, Query, Request, HTTPException
import secrets
from urllib.parse import urlparse, parse_qs
from app.core.rate_limit import auth_rate_limit
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth_schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, dependencies=[Depends(auth_rate_limit)])
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.register(req)


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(auth_rate_limit)])
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
    client_state: str = Query(..., min_length=32, max_length=100, pattern=r"^[a-zA-Z0-9-]+$"),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    google_url = service.get_google_login_url(redirect_uri, next, client_state)
    response = RedirectResponse(url=google_url, status_code=302)
    state = parse_qs(urlparse(google_url).query)["state"][0]
    response.set_cookie("gaga_oauth_state", state, max_age=600, httponly=True,
                        secure=service.settings.google_oauth_callback_url.startswith("https:"),
                        samesite="lax", path="/api/v1/auth/google")
    return response


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    expected = request.cookies.get("gaga_oauth_state", "")
    if not state or not expected or not secrets.compare_digest(state, expected):
        raise HTTPException(400, "登录验证已失效，请重新登录")
    service = AuthService(db)
    frontend_url = await service.handle_google_callback(code, state, error)
    response = RedirectResponse(url=frontend_url, status_code=302)
    response.delete_cookie("gaga_oauth_state", path="/api/v1/auth/google")
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response
