import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")
    invite_code_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("invite_codes.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    invite_code: Mapped["InviteCode | None"] = relationship("InviteCode", back_populates="users", foreign_keys=[invite_code_id])
    task_records: Mapped[list["TaskRecord"]] = relationship("TaskRecord", back_populates="user", cascade="all, delete-orphan")
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    generation_tasks: Mapped[list["GenerationTask"]] = relationship("GenerationTask", back_populates="user", cascade="all, delete-orphan")
