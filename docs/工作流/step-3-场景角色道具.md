# Step 3 — 场景 / 角色 / 道具

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 页面 | 场景 / 角色 / 道具 |
| 路由 | `/workflows/pro/step-3` |
| 涉及表 | `scripts`, `scenes`, `scene_images`, `characters`, `character_images`, `props` |
| 更新日期 | 2026-02-08 |
| 前端状态 | 占位 |

## 功能说明

基于 Step 2 定稿的剧本，抽取关键元素并生成可复用的视觉素材。页面顶部三个 Tab：

### Tab 1：场景

- 从剧本中自动抽取场景关键词
- 每个场景生成 **正/反/左/右** 四视图（`scene_images` 表，`view_type`: `front`/`back`/`left`/`right`）
- 用户可编辑 `prompt` 后重新生成

### Tab 2：角色

- 从剧本中自动抽取角色
- 每个角色生成 **三视图** + **全身照**（`character_images` 表，`view_type`: `three_view`/`full_body`）
- 每个角色关联 `voice_id`（TTS 音色 ID，用于 Step 6）
- 可配置 `voice_settings` JSON（音色参数）

### Tab 3：道具

- 从剧本中自动抽取道具
- 逐个生成素材图（`props.image_url`）
- 支持单独修改/重新生成

## 需要的接口

### 1. 从剧本抽取场景/角色/道具

**前端触发时机**：页面首次加载时自动调用（如果 `scripts` 表的 `extracted_*` 字段为空）。

```
POST /api/v1/projects/:id/script/extract
```

**Request**：空 body（后端从 `scripts.original_content` 读取）。

**Response（AI 抽取结果，同时写入 `scripts` 表的 JSON 字段及对应子表）：**

```json
{
  "scenes": [
    { "id": "uuid", "name": "樱花树下的公园", "description": "春天的公园", "prompt": "春天的公园，樱花飘落…" }
  ],
  "characters": [
    { "id": "uuid", "name": "小可爱", "description": "圆脸小动物", "prompt": "白色毛发，大眼睛…", "voice_id": null }
  ],
  "props": [
    { "id": "uuid", "name": "画笔", "description": "彩色画笔", "prompt": "一支彩色画笔…" }
  ]
}
```

> 后端同时将 ID 列表写入 `scripts.extracted_scenes`、`scripts.extracted_characters`、`scripts.extracted_props`。

---

### 2. 获取场景列表

**前端触发时机**：场景 Tab 加载时；图片生成后轮询。

```
GET /api/v1/projects/:id/scenes
```

**Response（对应 `scenes` + `scene_images` 表）：**

```json
[
  {
    "id": "uuid",
    "name": "樱花树下的公园",
    "description": "春天的公园",
    "prompt": "春天的公园，樱花飘落…",
    "is_generated": true,
    "states": 0,
    "images": [
      { "id": "uuid", "view_type": "front", "image_url": "https://cdn.xxx/front.png", "task_status": "success", "is_uploaded": false },
      { "id": "uuid", "view_type": "back", "image_url": null, "task_status": "running", "is_uploaded": false },
      { "id": "uuid", "view_type": "left", "image_url": null, "task_status": "pending", "is_uploaded": false },
      { "id": "uuid", "view_type": "right", "image_url": null, "task_status": "pending", "is_uploaded": false }
    ]
  }
]
```

### 3. 生成场景图片

**前端触发时机**：用户点击某个场景的"生成"按钮。

```
POST /api/v1/projects/:id/scenes/:sceneId/generate
```

**Request**：空 body（后端读取 `scenes.prompt` + `projects` 全局参数）。

**Response：**

```json
{
  "scene_id": "uuid",
  "images": [
    { "id": "uuid", "view_type": "front", "task_id": "task_001", "task_status": "pending" },
    { "id": "uuid", "view_type": "back", "task_id": "task_002", "task_status": "pending" },
    { "id": "uuid", "view_type": "left", "task_id": "task_003", "task_status": "pending" },
    { "id": "uuid", "view_type": "right", "task_id": "task_004", "task_status": "pending" }
  ]
}
```

> `task_status` 枚举：`pending` → `running` → `success` / `failed`

### 4. 更新场景

**前端触发时机**：用户编辑 prompt 后保存，或确认场景。

```
PUT /api/v1/projects/:id/scenes/:sceneId
```

**Request：**

```json
{
  "prompt": "修改后的提示词…"
}
```

---

### 5. 获取角色列表

**前端触发时机**：角色 Tab 加载时。

```
GET /api/v1/projects/:id/characters
```

**Response（对应 `characters` + `character_images` 表）：**

```json
[
  {
    "id": "uuid",
    "name": "小可爱",
    "description": "圆脸小动物",
    "prompt": "白色毛发，大眼睛…",
    "voice_id": "voice_001",
    "voice_settings": { "speed": 1.0, "pitch": 0 },
    "states": 0,
    "images": [
      { "id": "uuid", "view_type": "three_view", "image_url": "https://cdn.xxx/three_view.png", "task_status": "success" },
      { "id": "uuid", "view_type": "full_body", "image_url": null, "task_status": "pending" }
    ]
  }
]
```

### 6. 生成角色图片

**前端触发时机**：用户点击某个角色的"生成"按钮。

```
POST /api/v1/projects/:id/characters/:charId/generate
```

**Response**：同场景图片生成，返回 `character_images` 的 task 列表。

### 7. 更新角色

**前端触发时机**：用户编辑 prompt、关联音色后保存。

```
PUT /api/v1/projects/:id/characters/:charId
```

**Request：**

```json
{
  "prompt": "修改后的提示词…",
  "voice_id": "voice_002",
  "voice_settings": { "speed": 1.2, "pitch": -1 }
}
```

---

### 8. 获取道具列表

```
GET /api/v1/projects/:id/props
```

**Response（对应 `props` 表）：**

```json
[
  {
    "id": "uuid",
    "name": "画笔",
    "description": "彩色画笔",
    "prompt": "一支彩色画笔…",
    "image_url": "https://cdn.xxx/prop.png",
    "states": 0
  }
]
```

### 9. 生成道具图片

```
POST /api/v1/projects/:id/props/:propId/generate
```

### 10. 更新道具

```
PUT /api/v1/projects/:id/props/:propId
```

**Request：**

```json
{
  "prompt": "修改后的提示词…"
}
```
