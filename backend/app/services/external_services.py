"""Abstract service interfaces for email, payments, media."""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class EmailService(ABC):
    """Email service abstraction (Resend)."""
    
    @abstractmethod
    async def send_password_reset(
        self,
        email: str,
        reset_link: str,
        name: str
    ) -> bool:
        """Send password reset email."""
        pass
    
    @abstractmethod
    async def send_payment_confirmation(
        self,
        email: str,
        order_id: str,
        amount: float,
        course_title: str
    ) -> bool:
        """Send payment confirmation email."""
        pass
    
    @abstractmethod
    async def send_membership_confirmation(
        self,
        email: str,
        membership_name: str,
        expires_at: str
    ) -> bool:
        """Send membership confirmation email."""
        pass


class PaymentService(ABC):
    """Payment service abstraction (Mercado Pago / Stripe)."""
    
    @abstractmethod
    async def create_preference(
        self,
        user_id: int,
        course_id: int,
        amount: int,
        title: str,
        description: str
    ) -> Dict[str, Any]:
        """Create payment preference (Mercado Pago)."""
        pass
    
    @abstractmethod
    async def validate_payment(
        self,
        payment_id: str,
        token: str
    ) -> Dict[str, Any]:
        """Validate/process payment."""
        pass
    
    @abstractmethod
    async def process_membership_payment(
        self,
        user_id: int,
        membership_id: int,
        amount: int
    ) -> Dict[str, Any]:
        """Process membership payment."""
        pass


class MediaService(ABC):
    """Media service abstraction (S3)."""
    
    @abstractmethod
    async def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        action: str = "get_object"
    ) -> str:
        """Generate presigned URL for S3 object."""
        pass
    
    @abstractmethod
    async def generate_upload_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600
    ) -> str:
        """Generate presigned URL for uploading."""
        pass
    
    @abstractmethod
    async def delete_object(self, s3_key: str) -> bool:
        """Delete S3 object."""
        pass
    
    @abstractmethod
    async def get_object_metadata(self, s3_key: str) -> Dict[str, Any]:
        """Get S3 object metadata."""
        pass


class ResendEmailService(EmailService):
    """Resend email service implementation."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def send_password_reset(
        self,
        email: str,
        reset_link: str,
        name: str
    ) -> bool:
        """Send password reset email via Resend."""
        # TODO: Implement Resend API call
        return True
    
    async def send_payment_confirmation(
        self,
        email: str,
        order_id: str,
        amount: float,
        course_title: str
    ) -> bool:
        """Send payment confirmation via Resend."""
        # TODO: Implement Resend API call
        return True
    
    async def send_membership_confirmation(
        self,
        email: str,
        membership_name: str,
        expires_at: str
    ) -> bool:
        """Send membership confirmation via Resend."""
        # TODO: Implement Resend API call
        return True


class MercadoPagoService(PaymentService):
    """Mercado Pago payment service implementation."""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
    
    async def create_preference(
        self,
        user_id: int,
        course_id: int,
        amount: int,
        title: str,
        description: str
    ) -> Dict[str, Any]:
        """Create payment preference in Mercado Pago."""
        # TODO: Implement Mercado Pago API call
        return {}
    
    async def validate_payment(
        self,
        payment_id: str,
        token: str
    ) -> Dict[str, Any]:
        """Validate Mercado Pago payment."""
        # TODO: Implement Mercado Pago API call
        return {}
    
    async def process_membership_payment(
        self,
        user_id: int,
        membership_id: int,
        amount: int
    ) -> Dict[str, Any]:
        """Process membership payment."""
        # TODO: Implement Mercado Pago API call
        return {}


class S3MediaService(MediaService):
    """AWS S3 media service implementation."""
    
    def __init__(
        self,
        bucket: str,
        region: str,
        access_key: str,
        secret_key: str,
        endpoint: str = None
    ):
        self.bucket = bucket
        self.region = region
        self.access_key = access_key
        self.secret_key = secret_key
        self.endpoint = endpoint
    
    async def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        action: str = "get_object"
    ) -> str:
        """Generate presigned URL for S3 object."""
        # TODO: Implement S3 presigned URL generation
        return ""
    
    async def generate_upload_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600
    ) -> str:
        """Generate presigned URL for uploading."""
        # TODO: Implement S3 upload presigned URL
        return ""
    
    async def delete_object(self, s3_key: str) -> bool:
        """Delete S3 object."""
        # TODO: Implement S3 delete
        return True
    
    async def get_object_metadata(self, s3_key: str) -> Dict[str, Any]:
        """Get S3 object metadata."""
        # TODO: Implement S3 metadata retrieval
        return {}
