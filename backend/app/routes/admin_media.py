"""Admin media uploads (LocalStack S3 in dev)."""
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.middlewares.auth import require_permissions
from app.models import User, MediaAsset, MediaTypeEnum
from app.schemas import MediaAssetResponse
from app.services.storage_service import upload_file_bytes, S3NotConfiguredError
from app.core.config import get_settings

router = APIRouter(prefix="/admin/media", tags=["admin-media"])
settings = get_settings()

MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


def validate_type_and_mime(asset_type: str, content_type: str):
    if asset_type == MediaTypeEnum.IMAGE.value:
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid mime type for image")
    elif asset_type == MediaTypeEnum.VIDEO.value:
        if not content_type.startswith("video/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid mime type for video")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media type")


@router.post("", response_model=MediaAssetResponse)
async def upload_media(
    title: str = Form(...),
    type: str = Form(..., description="image|video"),
    category: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(require_permissions(["content:write"])),
    db: AsyncSession = Depends(get_db),
) -> MediaAssetResponse:
    # Validate type & mime
    validate_type_and_mime(type, file.content_type or "")

    # Read and size-check
    data = await file.read()
    if len(data) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large (max 50MB)")

    # Build storage key
    ext = ""
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1]
    key = f"media/{type}/{uuid4()}" + (f".{ext}" if ext else "")

    try:
        stored = upload_file_bytes(settings, data, key, file.content_type)
    except S3NotConfiguredError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Upload failed")

    asset = MediaAsset(
        title=title,
        type=MediaTypeEnum(type),
        category=category,
        storage_key=stored["key"],
        public_url=stored["url"],
        created_by=user.id,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return asset

