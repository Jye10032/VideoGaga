from pydantic import BaseModel
from typing import Literal


class ImageItem(BaseModel):
    image_key: str | None = None
    image_url: str | None = None


class ImageContent(BaseModel):
    type: Literal["text", "image_url"]
    text: str | None = None
    image_item: ImageItem | None = None


class Message(BaseModel):
    role: Literal["user"] = "user"
    content: list[ImageContent]


class GenerateImageRequest(BaseModel):
    model: str = "NBP"
    messages: list[Message]
    size: str = "1:1"
    quality: str | None = "1K"
    n: int | None = 1


class GenerateImageResponse(BaseModel):
    taskId: str
