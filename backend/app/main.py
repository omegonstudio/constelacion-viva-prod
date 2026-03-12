"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routes import (
    auth_router,
    users_router,
    courses_router,
    admin_router,
    public_router,
    gallery_router,
    admin_gallery_router,
    admin_media_router,
    therapist_router,
    webhooks_router,
    debug_router,
)

settings = get_settings()

app = FastAPI(
    title="Constelación Viva API",
    description="Holistic therapy platform with courses, memberships, and multitenancy",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://constelacionviva.com",
        "https://www.constelacionviva.com",
        "https://constelacionviva.com.ar",
        "https://www.constelacionviva.com.ar",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    # ⚠️  DO NOT use ["*"] here with allow_credentials=True.
    # Starlette 0.27.x returns "Access-Control-Allow-Headers: *" unconditionally
    # when allow_all_headers=True, which browsers (Chrome 96+, Firefox 95+) reject
    # for credentialed requests per the CORS spec.
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Tenant-Id"],
)

# Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(admin_router)
app.include_router(public_router)
app.include_router(gallery_router)
app.include_router(admin_gallery_router)
app.include_router(admin_media_router)
app.include_router(therapist_router)
app.include_router(webhooks_router)
app.include_router(debug_router)


@app.get("/")
async def root():
    return {
        "message": "Constelación Viva API",
        "environment": settings.environment,
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}