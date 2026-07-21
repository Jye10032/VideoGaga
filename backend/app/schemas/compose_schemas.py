from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


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


# ============ 基础操作模型 ============

class AudioOperation(CamelModel):
    """音频操作"""
    volume: float | None = Field(None, ge=0, le=16, description="音量调节倍数，0表示静音")
    speed: float | None = Field(None, ge=0.01, le=16, description="播放倍速")


class CropConfig(CamelModel):
    """裁剪区域配置"""
    xpos: float | None = Field(None, ge=0, le=1, description="裁剪区域左上角横坐标比例")
    ypos: float | None = Field(None, ge=0, le=1, description="裁剪区域左上角纵坐标比例")
    width: float | None = Field(None, ge=0, le=1, description="裁剪区域宽度比例")
    height: float | None = Field(None, ge=0, le=1, description="裁剪区域高度比例")


class PosMovement(CamelModel):
    """运动效果配置"""
    view_box: Literal["fixed"] | None = Field(None, description="画布展示区域")
    type: Literal[
        "left", "right", "up", "down",
        "leftUp", "leftDown", "rightUp", "rightDown",
        "zoomIn", "zoomOut"
    ] | None = Field(None, description="运动方式")
    speed: float | None = Field(None, description="运动速度")


class ImageOperation(CamelModel):
    """图像操作"""
    speed: float | None = Field(None, ge=0.01, le=16, description="播放倍速")
    crop: CropConfig | None = None
    rotate: int | None = Field(None, ge=0, le=359, description="顺时针旋转角度")
    mirror: Literal["hori", "vert", "full"] | None = Field(None, description="镜像效果")
    pos_movement: PosMovement | None = None


# ============ 轨道素材模型 ============

class AudioItem(CamelModel):
    """音频素材"""
    media_id: str | None = Field(None, description="媒资库的媒资id")
    source_url: str | None = Field(None, description="文件链接")
    start: float = Field(..., description="素材文件的起始时间，单位秒")
    duration: float = Field(..., gt=0, description="片段时长，单位秒")
    show_start: float = Field(..., description="在作品中的播放起点，单位秒")
    show_duration: float = Field(..., gt=0, description="在作品中的播放时长，单位秒")
    duration_padding_type: Literal["loop", "last_frame"] | None = Field(
        None, description="不足部分的填充方式"
    )
    audio_operations: list[AudioOperation] | None = Field(
        None, max_length=1, description="音频操作列表"
    )


class VideoItem(CamelModel):
    """视频/图片素材"""
    media_id: str | None = Field(None, description="媒资库的媒资id")
    source_url: str | None = Field(None, description="文件链接")
    type: Literal["video", "image", "mosaic"] = Field(..., description="素材类型")
    start: float | None = Field(None, description="素材文件的起始时间，单位秒")
    duration: float | None = Field(None, gt=0, description="片段时长，单位秒")
    show_start: float = Field(0, description="在作品中的播放起点，单位秒")
    show_duration: float = Field(..., gt=0, description="在作品中的播放时长，单位秒")
    duration_padding_type: Literal["loop", "last_frame"] | None = Field(
        None, description="不足部分的填充方式"
    )
    audio_operations: list[AudioOperation] | None = Field(
        None, max_length=1, description="音频操作列表"
    )
    image_operations: list[ImageOperation] | None = Field(
        None, max_length=5, description="图像操作列表"
    )
    position: Literal["custom", "fill", "fit", "stretch", "center"] | None = Field(
        None, description="画面放置位置"
    )
    xpos: float | None = Field(None, description="水平横坐标")
    ypos: float | None = Field(None, description="竖直纵坐标")
    width: float | None = Field(None, gt=0, description="宽度")
    height: float | None = Field(None, gt=0, description="高度")


class FontConfig(CamelModel):
    """字体配置"""
    family: Literal["Hei", "Song", "Kai"] | None = Field(None, description="字体名称")
    alignment: Literal["left", "center", "right"] | None = Field(None, description="对齐方式")
    size: int | None = Field(None, description="字号，单位像素")
    spacing: int | None = Field(None, description="字间距，单位像素")
    line_spacing: float | None = Field(None, description="行间距，字号的倍数")
    bold: bool | None = Field(None, description="是否加粗")
    italic: bool | None = Field(None, description="是否斜体")
    underline: bool | None = Field(None, description="是否下划线")
    strike_out: bool | None = Field(None, description="是否删除线")
    color: str | None = Field(None, description="字体颜色，#RRGGBB或#RRGGBBAA格式")
    outline_thickness: int | None = Field(None, description="描边宽度，单位像素")
    outline_color: str | None = Field(None, description="描边颜色")


class LayoutConfig(CamelModel):
    """布局配置"""
    avoid_overlap: bool | None = Field(None, description="是否自动避开重叠")
    fit_width: bool | None = Field(None, description="是否自动收缩宽度")
    fit_font_size: bool | None = Field(None, description="是否自动缩小字号")


class TextItem(CamelModel):
    """文本字幕"""
    text: str = Field(..., description="文本内容")
    show_start: float | None = Field(None, description="播放起始时间，单位秒")
    show_duration: float = Field(..., gt=0, description="播放持续时长，单位秒")
    anchor: Literal["topLeft", "bottomLeft"] | None = Field(None, description="定位锚点")
    xpos: float | None = Field(None, description="锚点横坐标")
    ypos: float | None = Field(None, description="锚点纵坐标")
    width: float = Field(..., description="字幕区域宽度")
    height: float | None = Field(None, description="字幕区域高度")
    padding: int | None = Field(None, description="内边缘留空宽度，单位像素")
    color: str | None = Field(None, description="背景颜色，#RRGGBB或#RRGGBBAA格式")
    font: FontConfig | None = None
    layout: LayoutConfig | None = None


# ============ 轨道模型 ============

class AudioTrack(CamelModel):
    """音频轨道"""
    items: list[AudioItem] = Field(..., description="音频素材列表")


class VideoTrack(CamelModel):
    """视频轨道"""
    items: list[VideoItem] = Field(..., description="视频/图片素材列表")


class TextTrack(CamelModel):
    """文本轨道"""
    items: list[TextItem] = Field(..., description="文本列表")


# ============ 时间轴和输出配置 ============

class ComposeTimeline(CamelModel):
    """剪辑时间轴"""
    audio_tracks: list[AudioTrack] | None = Field(
        None, max_length=10, description="音频轨道列表"
    )
    video_tracks: list[VideoTrack] = Field(
        ..., min_length=1, max_length=10, description="视频轨道列表"
    )
    text_tracks: list[TextTrack] | None = Field(
        None, max_length=10, description="文本轨道列表"
    )


class ComposeOutput(CamelModel):
    """导出配置"""
    file_name: str = Field(..., description="导出视频保存到媒资库的文件名")
    video_codec: Literal["h264", "h265"] | None = Field(None, description="视频编码")
    audio_codec: Literal["aac", "mp3"] | None = Field(None, description="音频编码")
    width: int | None = Field(None, description="分辨率宽度")
    height: int | None = Field(None, description="分辨率高度")
    frame_rate: float | None = Field(None, description="帧率")
    audio_sample_rate_in_hz: int | None = Field(None, description="音频采样率")
    audio_channels: int | None = Field(None, ge=1, le=7, description="音频声道数")
    compression_type: Literal["high", "mid", "low"] | None = Field(
        None, description="视频压缩质量"
    )
    gop: int | None = Field(None, description="i帧最大间隔")


# ============ 请求/响应 ============

class MediaComposeRequest(CamelModel):
    """视频云剪辑请求"""
    timeline: ComposeTimeline = Field(..., description="剪辑时间轴")
    output: ComposeOutput = Field(..., description="导出配置")


class MediaComposeResponse(CamelModel):
    """视频云剪辑响应"""
    task_id: str = Field(..., description="任务ID")
