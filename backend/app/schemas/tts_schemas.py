from __future__ import annotations
from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional


def to_camel(string: str) -> str:
    """将蛇形命名转换为小驼峰"""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class CamelModel(BaseModel):
    """支持小驼峰格式的基类"""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class TtsRequest(CamelModel):
    text: str
    voice_id: str
    speed: str | None = None
    volume: str | None = None
    pitch: str | None = None

    @field_validator("text", "voice_id")
    @classmethod
    def not_blank(cls, v: str):
        if not v.strip():
            raise ValueError("不能为空")
        return v

class TtsResponse(CamelModel):
    url: str


class VoiceDetail(CamelModel):
    voice_id: str
    # language: Optional[str] = None
    gender: str
    name: str | None = None
    description: str | None = None
    url: str | None = None
    cover_url: str | None = None
    # recommend: bool = False
    # new_voice: bool = False


class VoicesGetResponse(CamelModel):
    voices: List[VoiceDetail]
