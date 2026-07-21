import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Style(Base):
    __tablename__ = "styles"

    # 主键
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # 基本信息
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="2D动漫")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # 风格配置
    style_source: Mapped[str] = mapped_column(String(20), default="official")
    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    preview_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # 删除标记和排序
    is_delete: Mapped[int] = mapped_column(Integer, default=-1)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="style")
