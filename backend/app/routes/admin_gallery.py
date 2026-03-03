"""Admin Gallery endpoints (Objetivo 1)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.database import get_db
from app.middlewares.auth import require_role
from app.models import GalleryItem
from app.schemas.gallery import (
    GalleryCreate,
    GalleryItemOut,
    GalleryPresignRequest,
    GalleryPresignResponse,
    GalleryUpdate,
)
from app.services import storage_service

router = APIRouter(
    prefix="/admin/gallery",
    tags=["Admin Gallery"],
    dependencies=[Depends(require_role(["admin", "super_admin"]))],
)


@router.post("/presign", response_model=GalleryPresignResponse)
async def presign_gallery_upload(payload: GalleryPresignRequest):
    settings = get_settings()
    result = storage_service.create_presigned_upload(
        settings=settings,
        filename=payload.filename,
        content_type=payload.contentType,
        folder="gallery",
    )
    return {
        "uploadUrl": result.upload_url,
        "objectKey": result.object_key,
        "publicUrl": result.public_url,
    }


@router.post("", response_model=GalleryItemOut)
async def create_gallery_item(
    payload: GalleryCreate,
    db: AsyncSession = Depends(get_db),
):
    item = GalleryItem(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{item_id}", response_model=GalleryItemOut)
async def update_gallery_item(
    item_id: int,
    payload: GalleryUpdate,
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(GalleryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}")
async def delete_gallery_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Idempotente: si el item no existe, devolvemos ok=True.
    Resiliente: si S3 falla, igual borramos DB.
    """
    item = await db.get(GalleryItem, item_id)
    if not item:
        return {"ok": True}

    settings = get_settings()
    try:
        storage_service.delete_file_from_public_url(settings, item.src)
    except Exception:
        pass

    await db.delete(item)
    await db.commit()
    return {"ok": True}


