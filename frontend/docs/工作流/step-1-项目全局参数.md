# Step 1 — 项目全局参数确定

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 页面 | 项目全局参数确定 |
| 路由 | `/workflows/pro/step-1` |
| 涉及表 | `projects`, `styles` |
| 更新日期 | 2026-02-08 |

## 功能说明

用户在此页面配置项目的基础参数，所有选项确认后才能进入下一步。

### 配置项（对应 `projects` 表字段）

| 配置项 | 数据库字段 | 可选值 | 说明 |
| --- | --- | --- | --- |
| 画面比例 | `aspect_ratio` | `16:9`, `9:16`, `1:1`, `4:3` | 决定最终视频画幅 |
| 创作模式 | `creation_mode` | `image_to_video`, `multi_ref_to_video` | 图生视频 / 多参生视频 |
| 分镜图生成模式 | `storyboard_mode` | `single`, `nine_grid` | 单张分镜图 / 九宫格机位分镜图 |
| 画面风格 | `style_id` | 关联 `styles` 表 ID | 当前仅 2D 动漫 |

### 用户操作流程

1. 依次选择画面比例、创作模式、分镜图生成模式
2. 选择画面风格（当前仅 2D 动漫，后续从 `styles` 表拉取列表）
3. 全部选择后"下一步"按钮激活
4. 点击"下一步"保存配置并进入 Step 2

## 需要的接口

### 1. 获取官方风格库列表

**前端触发时机**：页面加载时调用，渲染风格选择卡片。

```
GET /api/v1/styles
```

**Response（对应 `styles` 表）：**

```json
[
  {
    "id": "uuid",
    "name": "2D 动漫",
    "category": "2D动漫",
    "description": "日系动漫画风",
    "preview_image_url": "https://cdn.xxx/style_2d.jpg",
    "sort_order": 0
  }
]
```

### 2. 保存项目全局参数

**前端触发时机**：用户点击"下一步"时调用。

```
PUT /api/v1/projects/:id/config
```

**Request（写入 `projects` 表对应字段）：**

```json
{
  "aspect_ratio": "16:9",
  "creation_mode": "image_to_video",
  "storyboard_mode": "single",
  "style_id": "uuid-of-2d-anime"
}
```

**Response：**

```json
{
  "id": "project-uuid",
  "aspect_ratio": "16:9",
  "creation_mode": "image_to_video",
  "storyboard_mode": "single",
  "style_id": "uuid-of-2d-anime",
  "current_step": 1,
  "version": 2,
  "updated_at": "2026-02-08T10:05:00Z"
}
```

> 后端同时将 `workflow_nodes` 表中 step=1 的节点标记为 `confirmed`。

### 3. 读取项目全局参数

**前端触发时机**：页面加载时调用，回显已保存的配置。

```
GET /api/v1/projects/:id/config
```

**Response**：同上述字段。未保存过则返回默认值。

## 当前状态

前端 UI 已完成，配置暂存 localStorage。接口就绪后替换为 API 调用，同时前端枚举值需从中文改为英文枚举（如 `image_to_video`）。
