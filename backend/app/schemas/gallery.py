# app/schemas/gallery.py
from pydantic import BaseModel
from app.models.enums import GalleryCategoryEnum, GalleryItemTypeEnum


class GalleryItemOut(BaseModel):
    id: int
    title: str
    type: GalleryItemTypeEnum
    category: GalleryCategoryEnum
    src: str
    video_src: str | None = None

    class Config:
        from_attributes = True


class GalleryCreate(BaseModel):
    title: str
    type: GalleryItemTypeEnum
    category: GalleryCategoryEnum
    src: str


class GalleryUpdate(BaseModel):
    title: str | None = None
    category: GalleryCategoryEnum | None = None


class GalleryPresignRequest(BaseModel):
    filename: str
    contentType: str


class GalleryPresignResponse(BaseModel):
    uploadUrl: str
    objectKey: str
    publicUrl: str
