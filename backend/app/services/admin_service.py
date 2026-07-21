from sqlalchemy import select, delete
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

        # Delete users who used this code
        for user in code.users:
            await self.db.delete(user)

        await self.db.delete(code)
        await self.db.commit()
        return {"message": "Invite code and associated users deleted"}

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

    async def delete_user(self, user_id: str) -> dict:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        await self.db.delete(user)
        await self.db.commit()
        return {"message": "User deleted"}
