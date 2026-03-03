from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Boolean,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    UniqueConstraint,
    Table,
    Enum,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Enum as SAEnum
from app.models.base import Base
from app.models.enums import (
    RoleEnum,
    LanguageEnum,
    LessonTypeEnum,
    GalleryItemTypeEnum,
    GalleryCategoryEnum,
    TherapistMembershipStatusEnum,
)


# ==========================================================
# Core models
# ==========================================================

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="tenant", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="tenant", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_tenants_slug", "slug"),)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    username = Column(String(100))
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(
        SQLEnum(
            RoleEnum,
            name="roleenum",
            native_enum=True,
            values_callable=lambda enum: [e.value for e in enum],
        ),
        default=RoleEnum.STUDENT,
        nullable=False,
    )
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    profile_image_url = Column(String(500))
    bio = Column(String(500))
    preferred_language = Column(SQLEnum(LanguageEnum, name="languageenum", native_enum=True, values_callable=lambda enum: [e.value for e in enum]), default=LanguageEnum.ES_LAT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="users")
    courses = relationship("Course", secondary="course_students", back_populates="students")
    memberships = relationship("UserMembership", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("CourseProgress", back_populates="user", cascade="all, delete-orphan")
    therapist_profile = relationship("TherapistProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    therapist_membership = relationship("TherapistMembership", back_populates="user", uselist=False, cascade="all, delete-orphan")
    passwords = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_tenant_id_email", "tenant_id", "email"),
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
    )


# ==========================================================
# Memberships
# ==========================================================

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)  # cents
    duration_days = Column(Integer, nullable=False)
    description = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="memberships")
    user_memberships = relationship("UserMembership", back_populates="membership", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_memberships_tenant_id", "tenant_id"),)


class UserMembership(Base):
    __tablename__ = "user_memberships"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    membership_id = Column(Integer, ForeignKey("memberships.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="memberships")
    membership = relationship("Membership", back_populates="user_memberships")

    __table_args__ = (Index("ix_user_memberships_user_id_is_active", "user_id", "is_active"),)


# ==========================================================
# Courses
# ==========================================================

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title_es = Column(String(255), nullable=False)
    title_en = Column(String(255))
    title_pt = Column(String(255))

    description_es = Column(String(2000))
    description_en = Column(String(2000))
    description_pt = Column(String(2000))

    is_free = Column(Boolean, default=False)
    price = Column(Integer)
    thumbnail_url = Column(String(500))
    is_published = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="courses")
    creator = relationship("User", foreign_keys=[creator_id])
    students = relationship("User", secondary="course_students", back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    progress = relationship("CourseProgress", back_populates="course", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_courses_tenant_id_creator_id", "tenant_id", "creator_id"),
        Index("ix_courses_is_published", "is_published"),
    )


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)

    title_es = Column(String(255), nullable=False)
    title_en = Column(String(255))
    title_pt = Column(String(255))

    description_es = Column(String(2000))
    description_en = Column(String(2000))
    description_pt = Column(String(2000))

    order = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_modules_course_id_order", "course_id", "order"),)


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)

    title_es = Column(String(255), nullable=False)
    title_en = Column(String(255))
    title_pt = Column(String(255))

    description_es = Column(String(2000))
    description_en = Column(String(2000))
    description_pt = Column(String(2000))

    content_type = Column(SQLEnum(LessonTypeEnum), nullable=False)
    content_text = Column(String(10000))
    s3_key = Column(String(500))
    s3_presigned_url = Column(String(1000))
    duration_seconds = Column(Integer)

    order = Column(Integer, nullable=False)
    is_locked = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    module = relationship("Module", back_populates="lessons")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_lessons_module_id_order", "module_id", "order"),)


# ==========================================================
# Progress / CMS / Legacy
# ==========================================================

class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    completion_percentage = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="progress")
    course = relationship("Course", back_populates="progress")

    lesson_progress = relationship(
        "LessonProgress",
        back_populates="course_progress",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_course_progress_user_id_course_id", "user_id", "course_id"),
    )


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True)
    course_progress_id = Column(Integer, ForeignKey("course_progress.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, default=False)
    watched_seconds = Column(Integer, default=0)

    course_progress = relationship("CourseProgress", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress")


class CMSContent(Base):
    __tablename__ = "cms_content"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(100), nullable=False)

    content_es = Column(String(5000), nullable=False)
    content_en = Column(String(5000))
    content_pt = Column(String(5000))

    content_type = Column(String(50), default="text")
    image_url = Column(String(500))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("ix_cms_content_tenant_id_key", "tenant_id", "key"),)


class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id = Column(Integer, primary_key=True)

    title = Column(String(255), nullable=False)

    type = Column(
        SQLEnum(
            GalleryItemTypeEnum,
            name="galleryitemtypeenum",
            native_enum=True,
            validate_strings=True,
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
    )

    category = Column(
        SQLEnum(
            GalleryCategoryEnum,
            name="gallerycategoryenum",
            native_enum=True,
            validate_strings=True,
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
    )

    src = Column(String(1000), nullable=False)
    video_src = Column(String(1000))
    created_at = Column(DateTime(timezone=True), server_default=func.now())



class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="passwords")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    filename = Column(String(500), nullable=False)
    key = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    content_type = Column(String(100))
    size = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TherapistProfile(Base):
    """
    Public-facing profile for therapist (minimal for now).
    Visibility in public listing is gated by membership status (Objetivo 2).
    """
    __tablename__ = "therapist_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)

    display_name = Column(String(255))
    slug = Column(String(255), index=True)
    bio = Column(String(2000))
    is_public = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="therapist_profile")


class TherapistMembership(Base):
    """
    Therapist membership lifecycle for Mercado Pago (Objetivo 2).
    One row per therapist (history can be added later).
    """
    __tablename__ = "therapist_memberships"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    status = Column(
        SQLEnum(
            TherapistMembershipStatusEnum,
            name="therapistmembershipstatusenum",
            native_enum=True,
            validate_strings=True,
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=TherapistMembershipStatusEnum.PENDING,
    )

    plan_months = Column(Integer, nullable=False, default=3)
    started_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    grace_until = Column(DateTime(timezone=True))

    # Mercado Pago bookkeeping (minimal)
    mp_preference_id = Column(String(255))
    mp_checkout_url = Column(String(2000))
    mp_subscription_id = Column(String(255), unique=True)
    mp_payment_id = Column(String(255), unique=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="therapist_membership")

    __table_args__ = (
        CheckConstraint("plan_months IN (3, 6, 12)", name="ck_therapist_memberships_plan_months"),
    )


# Association table
course_students = Table(
    "course_students",
    Base.metadata,
    Column("course_id", Integer, ForeignKey("courses.id", ondelete="CASCADE")),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Index("ix_course_students", "course_id", "user_id"),
)
