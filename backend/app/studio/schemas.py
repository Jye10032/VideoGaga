from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator
from urllib.parse import urlsplit


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Asset(StrictModel):
    id: str = Field(max_length=80)
    kind: Literal["character", "scene", "prop"]
    name: str = Field(max_length=100)
    description: str = Field(max_length=5000)
    image: str = Field(default="", max_length=8_000_000)
    confirmed: bool = False


class Shot(StrictModel):
    id: str = Field(max_length=80)
    title: str = Field(max_length=200)
    description: str = Field(max_length=5000)
    dialogue: str = Field(default="", max_length=5000)
    assetIds: list[str] = Field(default_factory=list, max_length=100)
    duration: int = Field(default=5, ge=1, le=30)
    camera: str = Field(default="固定镜头", max_length=200)
    voice: str = Field(default="alloy", max_length=100)
    image: str = Field(default="", max_length=8_000_000)
    video: str = Field(default="", max_length=2000)
    audio: str = Field(default="", max_length=8_000_000)
    muted: bool = False


class StudioData(StrictModel):
    script: str = Field(default="", max_length=50000)
    ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    assets: list[Asset] = Field(default_factory=list, max_length=100)
    shots: list[Shot] = Field(default_factory=list, max_length=100)


class SaveDocument(StrictModel):
    revision: int = Field(ge=0)
    name: str = Field(min_length=1, max_length=255)
    data: StudioData


class NewProject(StrictModel):
    name: str = Field(min_length=1, max_length=255)


class Provider(StrictModel):
    protocol: Literal["openai", "video-job"] = "openai"
    baseUrl: str = Field(max_length=1000)
    apiKey: SecretStr = Field(max_length=1000)
    model: str = Field(min_length=1, max_length=150)

    @field_validator("baseUrl")
    @classmethod
    def public_https(cls, value):
        url = urlsplit(value)
        if (
            url.scheme != "https"
            or not url.hostname
            or url.username
            or url.password
            or url.query
            or url.fragment
        ):
            raise ValueError("API 地址须为无凭据和查询参数的 HTTPS 地址")
        if url.port not in (None, 443):
            raise ValueError("API 仅支持 HTTPS 443 端口")
        return value.rstrip("/")


class GenerateRequest(StrictModel):
    acknowledgeDuplicate: bool = False
    requestId: str = Field(pattern=r"^[a-zA-Z0-9-]{16,36}$")
    kind: Literal["text", "image", "video", "audio"]
    targetId: str = Field(max_length=80)
    sourceHash: str = Field(pattern=r"^[a-f0-9]{64}$")
    prompt: str = Field(min_length=1, max_length=50000)
    provider: Provider
    duration: int = Field(default=5, ge=1, le=30)
    ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    voice: str = Field(default="alloy", max_length=100)
