import enum
from enum import StrEnum


class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    THERAPIST = "therapist"
    SPONSOR = "sponsor"
    STUDENT = "student"


class LanguageEnum(str, enum.Enum):
    ES_LAT = "es_lat"
    EN = "en"
    PT = "pt"


class LessonTypeEnum(str, enum.Enum):
    VIDEO = "video"
    TEXT = "text"
    PDF = "pdf"



class GalleryItemTypeEnum(StrEnum):
    IMAGE = "image"
    VIDEO = "video"



class GalleryCategoryEnum(str, enum.Enum):
    EVENTOS = "eventos"
    TERAPEUTAS = "terapeutas"


class MediaTypeEnum(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"


class TherapistMembershipStatusEnum(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"

