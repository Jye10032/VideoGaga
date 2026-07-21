import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class GenerationTask(Base):
    """通用生成任务表"""
    __tablename__ = "generation_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    node_type: Mapped[int] = mapped_column(Integer, nullable=False)  # 0:场景图, 1:人物三视图, 2:人物全身照, 3:道具图
    task_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # 自己生成的唯一ID
    baidu_task_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # 百度返回的任务ID
    task_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending, running, success, error
    task_input: Mapped[str | None] = mapped_column(Text, nullable=True)  # 生成提示词
    task_output: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # 结果数据（URL列表或错误信息）
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="generation_tasks")
    project: Mapped["Project"] = relationship("Project", back_populates="generation_tasks")
