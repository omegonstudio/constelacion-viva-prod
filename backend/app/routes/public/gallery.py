# app/api/routes/public/gallery.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.gallery import GalleryItem
from app.schemas.gallery import GalleryItemOut

router = APIRouter(prefix="/public/gallery", tags=["Public Gallery"])


@router.get("", response_model=list[GalleryItemOut])
def get_gallery(db: Session = Depends(get_db)):
    return (
        db.query(GalleryItem)
        .order_by(GalleryItem.id.desc())
        .all()
    )
