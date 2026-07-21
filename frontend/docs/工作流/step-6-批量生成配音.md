# Step 6 — 批量生成配音

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 页面 | 批量生成配音 |
| 路由 | `/workflows/pro/step-6` |
| 涉及表 | `voiceovers` |
| 更新日期 | 2026-02-08 |
| 前端状态 | 占位 |

## 功能说明

为每条分镜的台词/旁白生成配音音频。

### 用户操作流程

1. 页面展示所有有台词的分镜，每条显示角色名 + 台词文本
2. 用户可为每个角色确认音色（来自 `characters.voice_id`）
3. 用户点击"全部生成"发起批量配音任务
4. 每条配音独立显示状态：`pending` → `running` → `success` / `failed`
5. 已完成的可在线试听
6. 支持调整 TTS 参数后重新生成
7. 同一分镜可生成多个版本，用户选择一个（`is_selected = true`）
8. 全部完成后进入下一步

### 生成依赖

- `storyboards` 表：`dialogue`（台词文本）、`speaker_id`
- `characters` 表：`voice_id`、`voice_settings`

## 需要的接口

### 1. 批量生成配音

**前端触发时机**：用户点击"全部生成"按钮。

```
POST /api/v1/projects/:id/voiceovers/generate
```

**Request：**

```json
{
  "storyboard_ids": ["sb-uuid-1", "sb-uuid-2"]
}
```

> 空数组或不传 = 为所有有台词的分镜生成配音。

**Response：**

```json
{
  "voiceovers": [
    {
      "id": "uuid",
      "storyboard_id": "sb-uuid-1",
      "character_id": "char-uuid-1",
      "voice_id": "voice_001",
      "text": "我们约好了，每当想念对方的时候……",
      "task_id": "atask_001",
      "task_status": "pending",
      "version": 1
    }
  ]
}
```

### 2. 获取配音列表及状态

**前端触发时机**：页面加载时；生成后轮询。

```
GET /api/v1/projects/:id/voiceovers
```

**Response（对应 `voiceovers` 表）：**

```json
[
  {
    "id": "uuid",
    "storyboard_id": "sb-uuid-1",
    "character_id": "char-uuid-1",
    "text": "我们约好了，每当想念对方的时候……",
    "audio_url": "https://cdn.xxx/vo.mp3",
    "duration": 3.5,
    "voice_id": "voice_001",
    "tts_params": { "speed": 1.0, "pitch": 0 },
    "task_id": "atask_001",
    "task_status": "success",
    "version": 1,
    "is_selected": true
  }
]
```

### 3. 更新配音参数

**前端触发时机**：用户调整 TTS 参数或更换音色后保存。

```
PUT /api/v1/projects/:id/voiceovers/:voId
```

**Request：**

```json
{
  "voice_id": "voice_002",
  "tts_params": { "speed": 1.2, "pitch": -1 }
}
```

> 更新参数后需重新生成才能生效。

### 4. 重试配音生成

**前端触发时机**：用户点击"重试"按钮。

```
POST /api/v1/projects/:id/voiceovers/:voId/retry
```

**Response：**

```json
{
  "id": "uuid",
  "task_id": "atask_001_v2",
  "task_status": "pending",
  "version": 2
}
```
