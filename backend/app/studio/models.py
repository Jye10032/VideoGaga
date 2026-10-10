from datetime import datetime
from sqlalchemy import String, ForeignKey, JSON, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class StudioDocument(Base):
    __tablename__ = "studio_documents"
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    revision: Mapped[int] = mapped_column(Integer, default=0)
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class StudioRun(Base):
    __tablename__ = "studio_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(12))
    target_id: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(20), default="running")
    source_hash: Mapped[str] = mapped_column(String(64))
    provider_fingerprint: Mapped[str] = mapped_column(String(64))
    output: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
