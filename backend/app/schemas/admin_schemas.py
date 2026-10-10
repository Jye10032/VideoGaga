from pydantic import BaseModel, Field
from typing import Optional


class CreateInviteCodeRequest(BaseModel):
    code: str = Field(min_length=8, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    is_admin_code: bool = False
    max_uses: int = Field(default=1, ge=1, le=1000)


class InviteCodeResponse(BaseModel):
    id: str
    code: str
    is_admin_code: bool
    max_uses: int
    used_count: int
    created_at: str
    users: list[dict]
    expires_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    is_active: bool
    created_at: str
    invite_code: Optional[str] = None

    class Config:
        from_attributes = True
