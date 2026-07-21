from pydantic import BaseModel, field_validator


class ImageUploadRequest(BaseModel):
    name: str
    container: str

    @field_validator('container')
    @classmethod
    def validate_container(cls, v: str) -> str:
        allowed = {'jpeg', 'png', 'jpg', 'webp'}
        if v.lower() not in allowed:
            raise ValueError(f'container must be one of: {", ".join(allowed)}')
        return v.lower()


class ImageUploadResponse(BaseModel):
    imageKey: str
    uploadUrl: str
