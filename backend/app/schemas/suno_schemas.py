from pydantic import BaseModel, Field, model_validator
from typing import Literal


class SunoGenerateRequest(BaseModel):
    """音乐生成请求"""

    prompt: str | None = None
    style: str | None = None
    title: str | None = None
    custom_mode: bool
    instrumental: bool
    model: Literal["V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5"]
    persona_id: str | None = None
    negative_tags: str | None = None
    vocal_gender: Literal["m", "f"] | None = None
    style_weight: float | None = Field(None, ge=0, le=1)
    weirdness_constraint: float | None = Field(None, ge=0, le=1)
    audio_weight: float | None = Field(None, ge=0, le=1)
    callback_url: str | None = None

    @model_validator(mode="after")
    def validate_params(self):
        if self.custom_mode:
            if self.instrumental:
                if not self.style or not self.title:
                    raise ValueError("自定义纯音乐模式需要提供 style 和 title")
            else:
                if not self.style or not self.title or not self.prompt:
                    raise ValueError("自定义歌曲模式需要提供 style、title 和 prompt")
        else:
            if not self.prompt:
                raise ValueError("非自定义模式需要提供 prompt")
        return self


class SunoTaskData(BaseModel):
    task_id: str = Field(alias="taskId")


class SunoGenerateResponse(BaseModel):
    code: int
    msg: str
    data: SunoTaskData | None = None


class SunoAudioItem(BaseModel):
    id: str
    audio_url: str
    source_audio_url: str | None = None
    stream_audio_url: str | None = None
    source_stream_audio_url: str | None = None
    image_url: str
    source_image_url: str | None = None
    prompt: str
    model_name: str
    title: str
    tags: str
    create_time: str = Field(alias="createTime")
    duration: float

    model_config = {"populate_by_name": True}


class SunoCallbackData(BaseModel):
    callback_type: Literal["text", "first", "complete", "error"] = Field(alias="callbackType")
    task_id: str
    data: list[SunoAudioItem] | None = None

    model_config = {"populate_by_name": True}


class SunoCallbackRequest(BaseModel):
    code: int
    msg: str
    data: SunoCallbackData


class SunoCallbackResponse(BaseModel):
    status: str = "received"


class SunoRecordAudioItem(BaseModel):
    """查询接口返回的音频项（字段名使用 camelCase）"""

    id: str
    audio_url: str = Field(alias="audioUrl")
    stream_audio_url: str | None = Field(None, alias="streamAudioUrl")
    image_url: str = Field(alias="imageUrl")
    prompt: str
    model_name: str = Field(alias="modelName")
    title: str
    tags: str
    create_time: str = Field(alias="createTime")
    duration: float

    model_config = {"populate_by_name": True}


class SunoRecordResponse(BaseModel):
    """任务响应数据"""

    task_id: str = Field(alias="taskId")
    suno_data: list[SunoRecordAudioItem] | None = Field(None, alias="sunoData")

    model_config = {"populate_by_name": True}


class SunoRecordData(BaseModel):
    """查询接口返回的任务详情"""

    task_id: str = Field(alias="taskId")
    parent_music_id: str | None = Field(None, alias="parentMusicId")
    param: str | None = None
    response: SunoRecordResponse | None = None
    status: Literal[
        "PENDING",
        "TEXT_SUCCESS",
        "FIRST_SUCCESS",
        "SUCCESS",
        "CREATE_TASK_FAILED",
        "GENERATE_AUDIO_FAILED",
        "CALLBACK_EXCEPTION",
        "SENSITIVE_WORD_ERROR",
    ]
    type: str | None = None
    operation_type: str | None = Field(None, alias="operationType")
    error_code: int | None = Field(None, alias="errorCode")
    error_message: str | None = Field(None, alias="errorMessage")

    model_config = {"populate_by_name": True}


class SunoRecordInfoResponse(BaseModel):
    """获取音乐生成详情响应"""

    code: int
    msg: str
    data: SunoRecordData | None = None
