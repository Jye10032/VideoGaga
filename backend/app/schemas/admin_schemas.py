from pydantic import BaseModel
from typing import Optional


class CreateInviteCodeRequest(BaseModel):
    code: str
    is_admin_code: bool = False
    max_uses: int = 1


class InviteCodeResponse(BaseModel):
    id: str
    code: str
    is_admin_code: bool
    max_uses: int
    used_count: int
    created_at: str
    users: list[dict]

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
