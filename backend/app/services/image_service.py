import uuid
import boto3
from botocore.config import Config
from app.config import get_settings
from app.schemas.image_schemas import ImageUploadRequest, ImageUploadResponse


class ImageService:
    """图片上传服务 - Cloudflare R2"""

    def __init__(self):
        settings = get_settings()
        self.bucket_name = settings.r2_bucket_name
        self.public_url = settings.r2_public_url.rstrip('/')

        # R2 uses S3-compatible API
        self.s3_client = boto3.client(
            's3',
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )

    async def create_upload(self, request: ImageUploadRequest) -> ImageUploadResponse:
        # Generate unique key
        file_ext = request.container.lower()
        image_key = f"images/{uuid.uuid4()}.{file_ext}"

        # Generate presigned URL for upload (valid for 1 hour)
        content_type = f"image/{file_ext}"
        if file_ext == 'jpg':
            content_type = 'image/jpeg'

        upload_url = self.s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': image_key,
                'ContentType': content_type,
            },
            ExpiresIn=3600
        )

        return ImageUploadResponse(
            imageKey=image_key,
            uploadUrl=upload_url
        )

    def get_public_url(self, image_key: str) -> str:
        """Get public URL for an image"""
        return f"{self.public_url}/{image_key}"
