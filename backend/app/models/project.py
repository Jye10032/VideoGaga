import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    # 主键和关联
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 基本信息
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 全局参数
    aspect_ratio: Mapped[str] = mapped_column(String(10), default="16:9")
    creation_mode: Mapped[str] = mapped_column(String(30), default="image_to_video")
    script_mode: Mapped[str] = mapped_column(String(20), default="creative")

    # 风格设置
    style_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("styles.id"), nullable=True)

    # 工作流状态
    current_step: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="CREATED")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 版本与时间
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # 关系
    user: Mapped["User"] = relationship("User", back_populates="projects")
    style: Mapped["Style | None"] = relationship("Style", back_populates="projects")
    script: Mapped["Script | None"] = relationship("Script", back_populates="project", uselist=False, cascade="all, delete-orphan")
    scenes: Mapped[list["Scene"]] = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    generation_tasks: Mapped[list["GenerationTask"]] = relationship("GenerationTask", back_populates="project", cascade="all, delete-orphan")
