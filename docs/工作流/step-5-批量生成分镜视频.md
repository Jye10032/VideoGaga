# Step 5 — 批量生成分镜视频

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 页面 | 批量生成分镜视频 |
| 路由 | `/workflows/pro/step-5` |
| 涉及表 | `storyboard_videos` |
| 更新日期 | 2026-02-08 |
| 前端状态 | 占位 |

## 功能说明

基于 Step 4 的分镜脚本，批量生成每条分镜对应的视频片段。

### 用户操作流程

1. 页面展示所有分镜列表，每条显示画面描述缩略信息
2. 用户点击"全部生成"发起批量任务
3. 每条分镜独立显示生成状态：`pending` → `running` → `success` / `failed`
4. 已完成的视频可在线预览播放
5. 失败的可单独点击"重试"
6. 同一分镜可生成多个版本，用户选择一个（`is_selected = true`）
7. 全部完成后进入下一步

### 生成依赖

后端生成视频时需读取：
- `projects` 表：`aspect_ratio`、`creation_mode`、`style_id`
- `scenes`/`characters`/`props` 表：素材图片
- `storyboards` 表：`description`、`storyboard_image_url`（图生视频）或 `reference_image_urls`（多参）

## 需要的接口

### 1. 批量生成分镜视频

**前端触发时机**：用户点击"全部生成"按钮。

```
POST /api/v1/projects/:id/storyboard-videos/generate
```

**Request：**

```json
{
  "storyboard_ids": ["sb-uuid-1", "sb-uuid-2"]
}
```

> 空数组或不传 = 为所有分镜生成视频。

**Response：**

```json
{
  "videos": [
    {
      "id": "uuid",
      "storyboard_id": "sb-uuid-1",
      "task_id": "task_001",
      "task_status": "pending",
      "version": 1
    }
  ]
}
```

### 2. 获取分镜视频列表及状态

**前端触发时机**：页面加载时；生成后轮询（建议 3~5 秒）。

```
GET /api/v1/projects/:id/storyboard-videos
```

**Response（对应 `storyboard_videos` 表）：**

```json
[
  {
    "id": "uuid",
    "storyboard_id": "sb-uuid-1",
    "video_url": "https://cdn.xxx/video.mp4",
    "thumbnail_url": "https://cdn.xxx/thumb.jpg",
    "duration": 5.2,
    "generation_params": { "model": "xxx", "seed": 12345 },
    "task_id": "task_001",
    "task_status": "success",
    "error_message": null,
    "version": 1,
    "is_selected": true
  },
  {
    "id": "uuid",
    "storyboard_id": "sb-uuid-2",
    "video_url": null,
    "thumbnail_url": null,
    "duration": null,
    "generation_params": null,
    "task_id": "task_002",
    "task_status": "failed",
    "error_message": "生成超时，请重试",
    "version": 1,
    "is_selected": false
  }
]
```

**`task_status` 枚举**：`pending` → `running` → `success` / `failed` / `cancelled`

### 3. 重试单条视频生成

**前端触发时机**：用户点击失败视频的"重试"按钮。

```
POST /api/v1/projects/:id/storyboard-videos/:videoId/retry
```

**Response：**

```json
{
  "id": "uuid",
  "task_id": "task_001_v2",
  "task_status": "pending",
  "version": 2
}
```

> 重试会递增 `version`，保留历史记录。
