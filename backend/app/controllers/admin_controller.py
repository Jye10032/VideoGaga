from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.admin_schemas import CreateInviteCodeRequest, InviteCodeResponse, UserListResponse
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/invite-codes", response_model=list[InviteCodeResponse])
async def get_invite_codes(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    service = AdminService(db)
    return await service.get_invite_codes()


@router.post("/invite-codes", response_model=InviteCodeResponse)
async def create_invite_code(
    req: CreateInviteCodeRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    service = AdminService(db)
    return await service.create_invite_code(req, admin.id)


@router.delete("/invite-codes/{code_id}")
async def delete_invite_code(
    code_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    service = AdminService(db)
    return await service.delete_invite_code(code_id)


@router.get("/users", response_model=list[UserListResponse])
async def get_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    service = AdminService(db)
    return await service.get_users()


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    service = AdminService(db)
    return await service.update_user(user_id, False, admin.id)


class UserStatusUpdate(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}")
async def update_user(user_id: str, req: UserStatusUpdate, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    return await AdminService(db).update_user(user_id, req.is_active, admin.id)
