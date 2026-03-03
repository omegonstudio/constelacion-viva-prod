from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models import (
    RoleEnum,
    LanguageEnum,
    GalleryItemTypeEnum,
    GalleryCategoryEnum,
    MediaTypeEnum,
    TherapistMembershipStatusEnum,
)


# Auth schemas
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int
    tenant_id: int
    role: RoleEnum
    exp: datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    tenant_id: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    bio: Optional[str] = None
    preferred_language: LanguageEnum = LanguageEnum.ES_LAT


class UserCreate(UserBase):
    password: str
    role: RoleEnum = RoleEnum.STUDENT


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    preferred_language: Optional[LanguageEnum] = None
    profile_image_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: RoleEnum
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True



# Membership schemas
class MembershipBase(BaseModel):
    name: str
    price: int
    duration_days: int
    description: Optional[str] = None


class MembershipCreate(MembershipBase):
    pass


class MembershipResponse(MembershipBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserMembershipResponse(BaseModel):
    id: int
    membership: MembershipResponse
    started_at: datetime
    expires_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# Course schemas
class CourseBase(BaseModel):
    title_es: str
    title_en: Optional[str] = None
    title_pt: Optional[str] = None
    description_es: Optional[str] = None
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    is_free: bool = False
    price: Optional[int] = None
    thumbnail_url: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title_es: Optional[str] = None
    title_en: Optional[str] = None
    title_pt: Optional[str] = None
    description_es: Optional[str] = None
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    is_free: Optional[bool] = None
    price: Optional[int] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None


class CourseResponse(CourseBase):
    id: int
    creator_id: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Module schemas
class ModuleBase(BaseModel):
    title_es: str
    title_en: Optional[str] = None
    title_pt: Optional[str] = None
    description_es: Optional[str] = None
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    order: int


class ModuleCreate(ModuleBase):
    pass


class ModuleResponse(ModuleBase):
    id: int
    course_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Lesson schemas
class LessonBase(BaseModel):
    title_es: str
    title_en: Optional[str] = None
    title_pt: Optional[str] = None
    description_es: Optional[str] = None
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    order: int


class LessonCreate(LessonBase):
    content_type: str
    content_text: Optional[str] = None
    s3_key: Optional[str] = None
    duration_seconds: Optional[int] = None


class LessonResponse(LessonBase):
    id: int
    module_id: int
    content_type: str
    duration_seconds: Optional[int]
    is_locked: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Progress schemas
class LessonProgressResponse(BaseModel):
    id: int
    lesson_id: int
    is_completed: bool
    watched_seconds: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class CourseProgressResponse(BaseModel):
    id: int
    course_id: int
    completion_percentage: int
    started_at: datetime
    completed_at: Optional[datetime]
    lesson_progress: list[LessonProgressResponse]
    
    class Config:
        from_attributes = True


# CMS schemas
class CMSContentBase(BaseModel):
    content_es: str
    content_en: Optional[str] = None
    content_pt: Optional[str] = None
    image_url: Optional[str] = None


class CMSContentCreate(CMSContentBase):
    key: str


class CMSContentResponse(CMSContentBase):
    id: int
    key: str
    content_type: str
    
    class Config:
        from_attributes = True


# Upload schemas
class UploadResponse(BaseModel):
    id: int
    filename: str
    key: str
    url: str
    content_type: Optional[str]
    size: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class MediaAssetResponse(BaseModel):
    id: int
    title: str
    type: MediaTypeEnum
    category: str
    storage_key: str
    public_url: str
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Gallery schemas
class GalleryItemResponse(BaseModel):
    id: int
    title: str
    type: GalleryItemTypeEnum
    category: GalleryCategoryEnum
    src: str
    video_src: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TherapistMembershipResponse(BaseModel):
    status: TherapistMembershipStatusEnum
    plan_months: int
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    grace_until: Optional[datetime] = None
    warning: bool = False


class TherapistMembershipCheckoutRequest(BaseModel):
    plan_months: int

    def validate_plan(self) -> int:
        # helper used by routes (no implicit validation side effects)
        if self.plan_months not in (3, 6, 12):
            raise ValueError("plan_months must be one of 3, 6, 12")
        return self.plan_months


class TherapistMembershipCheckoutResponse(BaseModel):
    preference_id: str
    init_point: str
    checkout_url: str


class AdminTherapistListItem(BaseModel):
    id: int
    full_name: str
    email: str
    role: str  # therapist
    membership_status: TherapistMembershipStatusEnum
    payment_status: str  # paid | pending | overdue | na
    grace_until: Optional[datetime] = None
    current_period_end: Optional[datetime] = None


class AdminTherapistDetail(AdminTherapistListItem):
    plan_months: int
    started_at: Optional[datetime] = None
    mp_preference_id: Optional[str] = None
    mp_payment_id: Optional[str] = None
