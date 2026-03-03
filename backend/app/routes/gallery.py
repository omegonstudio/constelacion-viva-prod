"""Public gallery routes (read-only)."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.database import get_db
from app.models import MediaAsset
from app.schemas import MediaAssetResponse

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("", response_model=list[MediaAssetResponse])
async def list_gallery(
    category: Optional[str] = Query(None),
    type: Optional[str] = Query(None, description="image|video"),
    db: AsyncSession = Depends(get_db),
) -> list[MediaAsset]:
    query = select(MediaAsset).order_by(desc(MediaAsset.created_at))

    if category:
        query = query.where(MediaAsset.category == category)
    if type:
        query = query.where(MediaAsset.type == type)

    result = await db.execute(query)
    return result.scalars().all()

