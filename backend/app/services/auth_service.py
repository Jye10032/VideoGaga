from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, urlparse, parse_qsl, urlunparse
import secrets
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
import httpx
from jose import jwt, JWTError
from app.models.user import User
from app.models.invite_code import InviteCode
from app.schemas.auth_schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.config import get_settings


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def register(self, req: RegisterRequest) -> UserResponse:
        # Check invite code
        result = await self.db.execute(select(InviteCode).where(InviteCode.code == req.invite_code))
        invite_code = result.scalar_one_or_none()
        if not invite_code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邀请码无效")
        if invite_code.max_uses > 0 and invite_code.used_count >= invite_code.max_uses:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邀请码已用完")
        if invite_code.expires_at and invite_code.expires_at < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邀请码已过期")

        # Auto-generate email if not provided
        email = req.email or f"{req.username}@videogaga.local"

        # Check if email or username exists
        result = await self.db.execute(
            select(User).where(or_(User.email == email, User.username == req.username))
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在")

        # Create user
        role = "admin" if invite_code.is_admin_code else "user"
        user = User(
            email=email,
            username=req.username,
            password_hash=hash_password(req.password),
            role=role,
            invite_code_id=invite_code.id
        )
        self.db.add(user)

        # Update invite code usage
        invite_code.used_count += 1
        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            created_at=user.created_at.isoformat()
        )

    async def login(self, req: LoginRequest) -> TokenResponse:
        # Find user by email or username
        result = await self.db.execute(
            select(User).where(or_(User.email == req.account, User.username == req.account))
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号已被禁用")

        token = create_access_token(user.id)
        return TokenResponse(access_token=token)

    async def get_me(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            created_at=user.created_at.isoformat()
        )

    def get_google_login_url(self, frontend_redirect_uri: str, next_path: str = "/") -> str:
        """Build Google OAuth authorization URL."""
        if not self.settings.google_client_id or not self.settings.google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth 未配置",
            )

        redirect_uri = self._validate_frontend_redirect_uri(frontend_redirect_uri)
        safe_next = self._normalize_next_path(next_path)
        callback_url = self._get_google_callback_url()

        state = self._encode_oauth_state(
            {
                "redirect_uri": redirect_uri,
                "next": safe_next,
            }
        )

        params = {
            "client_id": self.settings.google_client_id,
            "redirect_uri": callback_url,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "include_granted_scopes": "true",
            "prompt": "select_account",
            "state": state,
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    async def handle_google_callback(
        self,
        code: str | None,
        state: str | None,
        error: str | None,
    ) -> str:
        """
        Handle Google callback and return final frontend redirect URL.
        On success: ...?access_token=...&account=...&next=...
        On failure: ...?error=...
        """
        state_payload = self._decode_oauth_state(state)
        frontend_redirect_uri = self._validate_frontend_redirect_uri(
            state_payload.get("redirect_uri") or self._default_frontend_callback()
        )
        next_path = self._normalize_next_path(state_payload.get("next") or "/")

        if error:
            return self._append_query(
                frontend_redirect_uri,
                {"error": f"google_oauth_error:{error}"},
            )

        if not code:
            return self._append_query(frontend_redirect_uri, {"error": "missing_code"})

        try:
            token_data = await self._exchange_google_code_for_token(code)
            id_token = token_data.get("id_token")
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValueError("missing_google_access_token")

            google_userinfo = await self._fetch_google_userinfo(access_token, id_token)
            email = (google_userinfo.get("email") or "").strip().lower()
            if not email:
                raise ValueError("missing_google_email")

            user = await self._get_or_create_google_user(email, google_userinfo.get("name"))
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="账号已被禁用"
                )

            app_token = create_access_token(user.id)
            return self._append_query(
                frontend_redirect_uri,
                {
                    "access_token": app_token,
                    "account": user.username,
                    "next": next_path,
                },
            )
        except Exception as exc:
            return self._append_query(frontend_redirect_uri, {"error": str(exc)})

    async def _exchange_google_code_for_token(self, code: str) -> dict:
        callback_url = self._get_google_callback_url()
        payload = {
            "code": code,
            "client_id": self.settings.google_client_id,
            "client_secret": self.settings.google_client_secret,
            "redirect_uri": callback_url,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data=payload,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if resp.status_code != 200:
                raise ValueError(f"google_token_exchange_failed:{resp.text}")
            return resp.json()

    async def _fetch_google_userinfo(self, access_token: str, id_token: str | None = None) -> dict:
        # Prefer standard userinfo endpoint.
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code == 200:
                return resp.json()

        # Fallback to id_token claims if endpoint failed and id_token is present.
        if id_token:
            try:
                claims = jwt.get_unverified_claims(id_token)
                return claims if isinstance(claims, dict) else {}
            except Exception:
                pass

        raise ValueError("google_userinfo_fetch_failed")

    async def _get_or_create_google_user(self, email: str, display_name: str | None) -> User:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            return user

        base_username = self._slugify_username(display_name or email.split("@")[0] or "google_user")
        username = await self._ensure_unique_username(base_username)

        user = User(
            email=email,
            username=username,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="user",
            invite_code_id=None,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def _ensure_unique_username(self, base_username: str) -> str:
        candidate = base_username
        idx = 1
        while True:
            result = await self.db.execute(select(User).where(User.username == candidate))
            exists = result.scalar_one_or_none()
            if not exists:
                return candidate
            idx += 1
            candidate = f"{base_username}_{idx}"

    def _slugify_username(self, value: str) -> str:
        cleaned = "".join(ch.lower() if ch.isalnum() else "_" for ch in value).strip("_")
        cleaned = "_".join(part for part in cleaned.split("_") if part)
        if not cleaned:
            cleaned = "google_user"
        return cleaned[:40]

    def _get_google_callback_url(self) -> str:
        callback = (self.settings.google_oauth_callback_url or "").strip()
        if not callback:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GOOGLE_OAUTH_CALLBACK_URL 未配置",
            )
        return callback

    def _allowed_redirect_origins(self) -> set[str]:
        raw = self.settings.google_oauth_allowed_origins or ""
        origins = {x.strip().rstrip("/") for x in raw.split(",") if x.strip()}
        return origins

    def _validate_frontend_redirect_uri(self, uri: str) -> str:
        parsed = urlparse(uri)
        if parsed.scheme not in {"http", "https"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid redirect_uri scheme")
        if not parsed.netloc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid redirect_uri host")

        origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
        if origin not in self._allowed_redirect_origins():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="redirect_uri origin not allowed")

        # Keep path/query if provided, but normalize fragments away.
        return urlunparse((parsed.scheme, parsed.netloc, parsed.path or "/", parsed.params, parsed.query, ""))

    def _normalize_next_path(self, next_path: str | None) -> str:
        if not next_path:
            return "/"
        if not next_path.startswith("/") or next_path.startswith("//"):
            return "/"
        return next_path

    def _encode_oauth_state(self, payload: dict) -> str:
        body = {
            **payload,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        }
        return jwt.encode(body, self.settings.jwt_secret, algorithm=self.settings.jwt_algorithm)

    def _decode_oauth_state(self, state: str | None) -> dict:
        if not state:
            return {}
        try:
            data = jwt.decode(
                state,
                self.settings.jwt_secret,
                algorithms=[self.settings.jwt_algorithm],
            )
            return data if isinstance(data, dict) else {}
        except JWTError:
            return {}

    def _default_frontend_callback(self) -> str:
        # Fallback only when state is missing/invalid.
        return "http://localhost:3000/auth/google/callback"

    def _append_query(self, base_url: str, values: dict[str, str]) -> str:
        parsed = urlparse(base_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        for k, v in values.items():
            if v is None:
                continue
            query[k] = v
        new_query = urlencode(query)
        return urlunparse(
            (parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, "")
        )
