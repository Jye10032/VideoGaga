# Step 7 — 视频预览（多轴）

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 页面 | 视频预览（多轴） |
| 路由 | `/workflows/pro/step-7` |
| 涉及表 | `timelines`, `timeline_tracks`, `timeline_clips` |
| 更新日期 | 2026-02-08 |
| 前端状态 | 占位 |

## 功能说明

将 Step 5 的视频片段和 Step 6 的配音合成为完整作品，提供多轨时间线预览与最终导出。

### 用户操作流程

1. 页面加载后展示多轨时间线编辑器
2. 轨道类型（`timeline_tracks.track_type`）：
   - `video`：视频轨，排列分镜视频片段
   - `audio`：音频轨，排列配音片段 + 可选背景音乐
   - `subtitle`：字幕轨（可选）
3. 用户可拖拽调整片段位置、裁剪、调整音量/透明度
4. 点击播放按钮实时预览
5. 确认后点击"导出"发起最终合成
6. 等待导出完成，下载最终视频

## 需要的接口

### 1. 获取时间线数据

**前端触发时机**：页面加载时调用。

```
GET /api/v1/projects/:id/timeline
```

**Response（对应 `timelines` + `timeline_tracks` + `timeline_clips` 表）：**

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "total_duration": 8.2,
  "fps": 30,
  "resolution": "1920x1080",
  "tracks": [
    {
      "id": "uuid",
      "track_type": "video",
      "track_name": "视频轨 1",
      "track_index": 0,
      "is_muted": false,
      "is_locked": false,
      "clips": [
        {
          "id": "uuid",
          "storyboard_id": "sb-uuid-1",
          "storyboard_video_id": "sv-uuid-1",
          "voiceover_id": null,
          "start_time": 0,
          "end_time": 5.2,
          "source_start": 0,
          "source_end": 5.2,
          "volume": 1.0,
          "opacity": 1.0,
          "transition_in": null,
          "transition_out": "fade"
        }
      ]
    },
    {
      "id": "uuid",
      "track_type": "audio",
      "track_name": "配音轨",
      "track_index": 1,
      "is_muted": false,
      "is_locked": false,
      "clips": [
        {
          "id": "uuid",
          "storyboard_id": "sb-uuid-1",
          "storyboard_video_id": null,
          "voiceover_id": "vo-uuid-1",
          "start_time": 0.5,
          "end_time": 4.0,
          "source_start": 0,
          "source_end": 3.5,
          "volume": 1.0,
          "opacity": 1.0,
          "transition_in": null,
          "transition_out": null
        }
      ]
    }
  ]
}
```

### 2. 保存时间线编排

**前端触发时机**：用户拖拽调整后自动保存，或点击"保存"。

```
PUT /api/v1/projects/:id/timeline
```

**Request**：同上述 Response 结构（前端将完整 tracks + clips 数据回传）。

### 3. 发起最终视频导出

**前端触发时机**：用户点击"导出"按钮。

```
POST /api/v1/projects/:id/export
```

**Request：**

```json
{
  "resolution": "1920x1080",
  "fps": 30,
  "format": "mp4"
}
```

**Response：**

```json
{
  "export_id": "uuid",
  "status": "processing"
}
```

### 4. 查询导出进度

**前端触发时机**：导出发起后轮询（建议 5 秒间隔）。

```
GET /api/v1/projects/:id/export/status
```

**Response（进行中）：**

```json
{
  "export_id": "uuid",
  "status": "processing",
  "progress": 65
}
```

**Response（完成）：**

```json
{
  "export_id": "uuid",
  "status": "done",
  "progress": 100,
  "download_url": "https://cdn.xxx/final_video.mp4",
  "file_size": 52428800,
  "duration": 8.2
}
```

**status 枚举**：`processing`、`done`、`failed`

### `timeline_clips` 表字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `storyboard_id` | VARCHAR(36) FK | 关联分镜（可选） |
| `storyboard_video_id` | VARCHAR(36) FK | 关联视频（可选） |
| `voiceover_id` | VARCHAR(36) FK | 关联配音（可选） |
| `start_time` | REAL | 在轨道上的起始时间（秒） |
| `end_time` | REAL | 在轨道上的结束时间（秒） |
| `source_start` | REAL | 素材裁剪起始点（秒） |
| `source_end` | REAL | 素材裁剪结束点（秒） |
| `volume` | REAL | 音量 0~1 |
| `opacity` | REAL | 透明度 0~1 |
| `transition_in` | VARCHAR(50) | 入场转场效果 |
| `transition_out` | VARCHAR(50) | 出场转场效果 |
