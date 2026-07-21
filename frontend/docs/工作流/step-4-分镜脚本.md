# Step 4 — 分镜脚本

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 页面 | 分镜脚本 |
| 路由 | `/workflows/pro/step-4` |
| 涉及表 | `storyboards` |
| 更新日期 | 2026-02-08 |
| 前端状态 | 占位 |

## 功能说明

将剧本拆分为具体的分镜脚本。一个场景对应一组分镜。

### 用户操作流程

1. 用户点击"AI 生成分镜"，后端基于剧本 + 素材自动拆分
2. 生成结果以列表展示，每条分镜包含：
   - 关联场景（`scene_id`）
   - 出场角色（`character_ids` JSONB）
   - 使用道具（`prop_ids` JSONB）
   - 画面描述（`description`）
   - 台词内容（`dialogue`）+ 说话角色（`speaker_id`）
   - 镜头运动（`camera_movement`）
   - 预估时长（`duration`）
   - 分镜图（`storyboard_image_url`，图生视频模式）
   - 参考图列表（`reference_image_urls` JSONB，多参模式）
3. 用户可逐条编辑、增删、调整顺序
4. 确认后进入下一步

## 需要的接口

### 1. AI 生成分镜脚本

**前端触发时机**：用户点击"AI 生成分镜"按钮。

```
POST /api/v1/projects/:id/storyboards/generate
```

**Request：**

```json
{
  "regenerate": false
}
```

**Response（对应 `storyboards` 表）：**

```json
{
  "storyboards": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "scene_id": "uuid",
      "character_ids": ["char-uuid-1", "char-uuid-2"],
      "prop_ids": ["prop-uuid-1"],
      "description": "樱花树下，小可爱和兔子面对面站着，花瓣飘落",
      "dialogue": "我们约好了，每当想念对方的时候……",
      "speaker_id": "char-uuid-1",
      "camera_movement": "static",
      "duration": 5.0,
      "storyboard_image_url": null,
      "storyboard_image_prompt": "樱花树下两只小动物面对面…",
      "reference_image_urls": [],
      "states": 0
    }
  ]
}
```

### 2. 获取分镜列表

**前端触发时机**：页面加载时调用。

```
GET /api/v1/projects/:id/storyboards
```

**Response**：同上述 `storyboards` 数组。

### 3. 更新单条分镜

**前端触发时机**：用户编辑某条分镜后保存。

```
PUT /api/v1/projects/:id/storyboards/:shotId
```

**Request（只传需要修改的字段）：**

```json
{
  "description": "修改后的画面描述",
  "dialogue": "修改后的台词",
  "speaker_id": "char-uuid-2",
  "camera_movement": "zoom_in",
  "duration": 4.0,
  "scene_id": "scene-uuid-2",
  "character_ids": ["char-uuid-1"],
  "prop_ids": []
}
```

### 4. 删除单条分镜

```
DELETE /api/v1/projects/:id/storyboards/:shotId
```

### `storyboards` 表字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | VARCHAR(36) PK | 分镜唯一 ID |
| `project_id` | VARCHAR(36) FK | 所属项目 |
| `scene_id` | VARCHAR(36) FK | 关联场景 |
| `character_ids` | JSONB | 出场角色 ID 列表 |
| `prop_ids` | JSONB | 使用道具 ID 列表 |
| `description` | TEXT | 画面描述 |
| `dialogue` | TEXT | 台词内容 |
| `speaker_id` | VARCHAR(36) | 说话角色 ID |
| `camera_movement` | VARCHAR(20) | 镜头运动：`static`/`pan_left`/`zoom_in` 等 |
| `duration` | REAL | 预估时长（秒） |
| `storyboard_image_url` | VARCHAR(500) | 分镜图 URL（图生视频模式） |
| `storyboard_image_prompt` | TEXT | 分镜图提示词 |
| `reference_image_urls` | JSONB | 参考图 URL 列表（多参模式） |
| `states` | INTEGER | 状态 |
