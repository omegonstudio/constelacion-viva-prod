# app/models/gallery.py
from sqlalchemy import Column, Integer, String, Enum
from app.db.base import Base
import enum


class GalleryType(str, enum.Enum):
    image = "image"
    video = "video"


class GalleryCategory(str, enum.Enum):
    eventos = "eventos"
    terapeutas = "terapeutas"


class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    type = Column(Enum(GalleryType), nullable=False)
    category = Column(Enum(GalleryCategory), nullable=False)

    # URL pública (S3 / Vimeo)
    src = Column(String(1024), nullable=False)

    # solo si es video y querés separar
    video_src = Column(String(1024), nullable=True)
