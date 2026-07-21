from pydantic import BaseModel, Field, model_validator
from typing import Literal


class ImageItem(BaseModel):
    """图片项"""
    image_url: str | None = None
    image_key: str | None = None
    type: Literal["subject", "background"] | None = None
    ref_name: str | None = None


class HeadtailImages(BaseModel):
    """首尾帧图片"""
    head_image: ImageItem
    tail_image: ImageItem


# ========== Vidu VQ2 图生视频（角色参考） ==========
class ImageToVideoVQ2Input(BaseModel):
    """Vidu Q2 角色参考图生视频参数"""
    character_images: list[ImageItem] = Field(..., min_length=1, max_length=7)
    prompt: str = Field(..., max_length=2000)
    seed: int | None = None
    duration: Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 10] = 5
    resolution: Literal["360p", "540p", "720p", "1080p"] = "720p"
    aspect_ratio: Literal["16:9", "9:16", "4:3", "3:4", "1:1"] = "16:9"
    movement_amplitude: Literal["auto", "small", "medium", "large"] = "auto"
    bgm: bool = False
    off_peak: bool = False


# ========== VQ2P/VQ2T 图生视频 ==========
class ImageToVideoVQ2PInput(BaseModel):
    """Vidu Q2 Pro 图生视频参数"""
    image: ImageItem | None = None
    headtail_images: HeadtailImages | None = None
    prompt: str | None = Field(None, max_length=1500)
    seed: int | None = None
    duration: Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 10] | None = None
    resolution: Literal["720p", "1080p", "540p"]
    movement_amplitude: Literal["auto", "small", "medium", "large"] = "auto"

    @model_validator(mode="after")
    def validate_input_mode(self):
        modes = sum([
            self.image is not None,
            self.headtail_images is not None,
        ])
        if modes == 0:
            raise ValueError("必须提供 image 或 headtail_images 之一")
        if modes > 1:
            raise ValueError("只能提供 image 或 headtail_images 之一")
        if self.duration is None:
            raise ValueError("duration 必填")
        return self


class ImageToVideoVQ2TInput(BaseModel):
    """Vidu Q2 Turbo 图生视频参数"""
    image: ImageItem | None = None
    headtail_images: HeadtailImages | None = None
    prompt: str | None = Field(None, max_length=1500)
    seed: int | None = None
    duration: Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 10] | None = None
    resolution: Literal["720p", "1080p", "540p"]
    movement_amplitude: Literal["auto", "small", "medium", "large"] = "auto"

    @model_validator(mode="after")
    def validate_input_mode(self):
        modes = sum([
            self.image is not None,
            self.headtail_images is not None,
        ])
        if modes == 0:
            raise ValueError("必须提供 image 或 headtail_images 之一")
        if modes > 1:
            raise ValueError("只能提供 image 或 headtail_images 之一")
        if self.duration is None:
            raise ValueError("duration 必填")
        return self


# ========== VQ2 文生视频 ==========
class TextToVideoVQ2Input(BaseModel):
    """Vidu Q2 文生视频参数"""
    prompt: str = Field(..., max_length=2000)
    seed: int | None = None
    duration: Literal[1, 2, 3, 4, 5, 6, 7, 8] = 5
    resolution: Literal["540p", "720p", "1080p"] = "720p"
    aspect_ratio: Literal["16:9", "9:16", "3:4", "4:3", "1:1"] = "16:9"
    bgm: bool = False
    off_peak: bool = False


# ========== 统一请求 ==========
class ImageToVideoRequest(BaseModel):
    """图生视频统一请求"""
    model: Literal["VQ2", "VQ2P", "VQ2T"]
    model_vq2_task_input: ImageToVideoVQ2Input | None = None
    model_vq2p_task_input: ImageToVideoVQ2PInput | None = None
    model_vq2t_task_input: ImageToVideoVQ2TInput | None = None

    @model_validator(mode="after")
    def validate_task_input(self):
        model_input_map = {
            "VQ2": self.model_vq2_task_input,
            "VQ2P": self.model_vq2p_task_input,
            "VQ2T": self.model_vq2t_task_input,
        }
        if model_input_map.get(self.model) is None:
            raise ValueError(f"model_{self.model.lower()}_task_input 不能为空")
        return self


class TextToVideoRequest(BaseModel):
    """文生视频统一请求"""
    model: Literal["VQ2"]
    model_vq2_task_input: TextToVideoVQ2Input | None = None

    @model_validator(mode="after")
    def validate_task_input(self):
        model_input_map = {
            "VQ2": self.model_vq2_task_input,
        }
        if model_input_map.get(self.model) is None:
            raise ValueError(f"model_{self.model.lower()}_task_input 不能为空")
        return self


# ========== 响应 ==========
class VideoGenerateResponse(BaseModel):
    """视频生成响应"""
    task_id: str
