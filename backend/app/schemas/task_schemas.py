from pydantic import BaseModel
from typing import Literal


class VideoGenerateTaskInfo(BaseModel):
    errMsg: str | None = None
    unitPrice: float | None = None
    videoGenerateTaskInput: dict | None = None
    videoGenerateTaskOutput: dict | None = None


class ComposeTaskOutput(BaseModel):
    mediaId: str | None = None
    url: str | None = None


class ComposeTaskInfo(BaseModel):
    errMsg: str | None = None
    output: ComposeTaskOutput | None = None


class TaskDetail(BaseModel):
    taskId: str
    type: Literal["WORKFLOW", "PRESET", "COMPOSE", "FETCH", "HIGHLIGHT_UNDERSTAND", "DWM_DETECT", "VIDEO_GENERATE"] | None = None
    status: Literal["READY", "RUNNING", "SUCCESS", "FAILED", "FINISHED"] | None = None
    createTime: str | None = None
    finishTime: str | None = None
    videoGenerateTaskInfo: VideoGenerateTaskInfo | None = None
    composeTaskInfo: ComposeTaskInfo | None = None
