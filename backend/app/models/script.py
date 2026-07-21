import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Script(Base):
    __tablename__ = "scripts"

    # 主键和关联（一对一）
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)

    # 剧本内容
    original_content: Mapped[str] = mapped_column(Text, nullable=False)
    processed_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # AI 提取结果 (JSONB)
    dialogues: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    extracted_scenes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    extracted_characters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    extracted_props: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    storyboard_list: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # 版本与时间
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    project: Mapped["Project"] = relationship("Project", back_populates="script")
