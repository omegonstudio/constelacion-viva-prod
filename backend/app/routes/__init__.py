"""Routes init."""
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.courses import router as courses_router
from app.routes.admin import router as admin_router
from app.routes.public import router as public_router
from app.routes.gallery import router as gallery_router
from app.routes.admin_gallery import router as admin_gallery_router
from app.routes.admin_media import router as admin_media_router
from app.routes.therapist import router as therapist_router
from app.routes.webhooks import router as webhooks_router
from app.routes.debug import router as debug_router

__all__ = [
    "auth_router",
    "users_router",
    "courses_router",
    "admin_router",
    "public_router",
    "gallery_router",
    "admin_gallery_router",
    "admin_media_router",
    "therapist_router",
    "webhooks_router",
    "debug_router",
]
