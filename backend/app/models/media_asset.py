from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
import enum


class MediaTypeEnum(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"


class MediaAsset(Base):
    """
    Persistent media assets used by the public gallery.
    Uploaded by admins, stored in S3 / LocalStack.
    """
    __tablename__ = "media_assets"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    type = Column(SQLEnum(MediaTypeEnum), nullable=False)
    category = Column(String(100), nullable=False)

    storage_key = Column(String(500), nullable=False)
    public_url = Column(String(1000), nullable=False)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User")

    __table_args__ = (
        Index("ix_media_assets_category", "category"),
        Index("ix_media_assets_type", "type"),
    )
