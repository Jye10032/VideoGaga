from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.user import User
from app.models.invite_code import InviteCode
from app.schemas.admin_schemas import CreateInviteCodeRequest, InviteCodeResponse, UserListResponse


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_invite_codes(self) -> list[InviteCodeResponse]:
        result = await self.db.execute(
            select(InviteCode).options(selectinload(InviteCode.users))
        )
        codes = result.scalars().all()
        return [
            InviteCodeResponse(
                id=code.id,
                code=code.code,
                is_admin_code=code.is_admin_code,
                max_uses=code.max_uses,
                used_count=code.used_count,
                expires_at=code.expires_at.isoformat() if code.expires_at else None,
                created_at=code.created_at.isoformat(),
                users=[{"id": u.id, "username": u.username, "email": u.email} for u in code.users]
            )
            for code in codes
        ]

    async def create_invite_code(self, req: CreateInviteCodeRequest, created_by: str) -> InviteCodeResponse:
        # Check if code exists
        result = await self.db.execute(select(InviteCode).where(InviteCode.code == req.code))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite code already exists")

        code = InviteCode(
            code=req.code,
            is_admin_code=req.is_admin_code,
            max_uses=req.max_uses,
            created_by=created_by
        )
        self.db.add(code)
        await self.db.commit()
        await self.db.refresh(code)

        return InviteCodeResponse(
            id=code.id,
            code=code.code,
            is_admin_code=code.is_admin_code,
            max_uses=code.max_uses,
            used_count=code.used_count,
            created_at=code.created_at.isoformat(),
            users=[]
        )

    async def delete_invite_code(self, code_id: str) -> dict:
        result = await self.db.execute(
            select(InviteCode).options(selectinload(InviteCode.users)).where(InviteCode.id == code_id)
        )
        code = result.scalar_one_or_none()
        if not code:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found")

        # Revocation must never delete the accounts created with an invitation.
        from datetime import datetime
        code.expires_at = datetime.utcnow()
        await self.db.commit()
        return {"message": "邀请码已停用，已有用户不受影响"}

    async def get_users(self) -> list[UserListResponse]:
        result = await self.db.execute(
            select(User).options(selectinload(User.invite_code))
        )
        users = result.scalars().all()
        return [
            UserListResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at.isoformat(),
                invite_code=user.invite_code.code if user.invite_code else None
            )
            for user in users
        ]

    async def update_user(self, user_id: str, active: bool, actor_id: str) -> dict:
        if user_id == actor_id and not active:
            raise HTTPException(400, "不能停用当前管理员账号")
        # Lock all admins in a stable order to avoid concurrent removal of the last admin.
        admins = (await self.db.scalars(select(User).where(User.role == "admin").order_by(User.id).with_for_update().execution_options(populate_existing=True))).all()
        actor = next((u for u in admins if u.id == actor_id), None)
        if not actor or not actor.is_active:
            raise HTTPException(403, "管理员权限已失效")
        user = await self.db.get(User, user_id)
        if not user:
            raise HTTPException(404, "用户不存在")
        if user.role == "admin" and not active and sum(u.is_active for u in admins) <= 1:
            raise HTTPException(400, "必须保留一个启用的管理员")
        user.is_active = active
        await self.db.commit()
        return {"message": "用户状态已更新"}
