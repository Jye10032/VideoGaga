# 工作流文档

> 本文档面向后端开发，说明专业模式工作流各步骤的功能需求与接口依赖。
> 接口字段设计对齐《数据库设计》文档（PostgreSQL + SQLAlchemy 2.0）。

## 全局约定

### 认证

所有接口统一使用 Bearer Token 鉴权，Token 在登录时获取。

```
Authorization: Bearer <access_token>
```

### API 基础路径

- 生产：`https://api.videogaga.cc`
- 开发：`http://localhost:8000`
- 接口前缀：`/api/v1`

### 枚举值速查

| 枚举 | 可选值 |
| --- | --- |
| 画面比例 `aspect_ratio` | `16:9`, `9:16`, `1:1`, `4:3` |
| 创作模式 `creation_mode` | `image_to_video`（图生视频）, `multi_ref_to_video`（多参生视频） |
| 分镜图生成模式 `storyboard_mode` | `single`（单张分镜图）, `nine_grid`（九宫格机位分镜图） |
| 项目状态 `status` | `draft`, `script_ready`, `elements_ready`, `storyboard_ready`, `video_generating`, `audio_generating`, `completed` |
| 节点状态（人在回路） | `pending`, `processing`, `awaiting_confirm`, `confirmed`, `rejected` |
| 生成任务状态 `task_status` | `pending`, `running`, `success`, `failed`, `cancelled` |
| 场景视图 `view_type` | `front`, `back`, `left`, `right` |
| 角色视图 `view_type` | `three_view`（三视图）, `full_body`（全身照） |
| 镜头运动 `camera_movement` | `static`, `pan_left`, `pan_right`, `zoom_in`, `zoom_out`, `dolly` |
| 时间线轨道 `track_type` | `video`, `audio`, `subtitle` |

### 数据库表与步骤对应关系

| 步骤 | 涉及的表 |
| --- | --- |
| 通用 | `projects`, `styles`, `workflow_nodes` |
| 1 | `projects`（全局参数字段）, `styles` |
| 2 | `scripts` |
| 3 | `scenes`, `scene_images`, `characters`, `character_images`, `props` |
| 4 | `storyboards` |
| 5 | `storyboard_videos` |
| 6 | `voiceovers` |
| 7 | `timelines`, `timeline_tracks`, `timeline_clips` |

### 需要新增的接口总览

| 步骤 | 方法 | 路径（建议） | 说明 | 涉及表 |
| --- | --- | --- | --- | --- |
| 通用 | POST | `/api/v1/projects` | 创建项目 | `projects` |
| 通用 | GET | `/api/v1/projects/:id` | 获取项目详情 | `projects` |
| 通用 | GET | `/api/v1/projects/:id/workflow-nodes` | 获取流程节点状态 | `workflow_nodes` |
| 通用 | PUT | `/api/v1/projects/:id/workflow-nodes/:step` | 确认/拒绝节点 | `workflow_nodes` |
| 通用 | GET | `/api/v1/styles` | 获取官方风格库列表 | `styles` |
| 1 | PUT | `/api/v1/projects/:id/config` | 保存全局参数 | `projects` |
| 1 | GET | `/api/v1/projects/:id/config` | 读取全局参数 | `projects` |
| 2 | POST | `/api/v1/projects/:id/script/generate` | AI 扩写剧本 | `scripts` |
| 2 | PUT | `/api/v1/projects/:id/script` | 保存/定稿剧本 | `scripts` |
| 2 | GET | `/api/v1/projects/:id/script` | 读取剧本 | `scripts` |
| 3 | POST | `/api/v1/projects/:id/script/extract` | 从剧本抽取场景/角色/道具 | `scripts`, `scenes`, `characters`, `props` |
| 3 | GET | `/api/v1/projects/:id/scenes` | 获取场景列表 | `scenes`, `scene_images` |
| 3 | POST | `/api/v1/projects/:id/scenes/:sceneId/generate` | 生成场景图片 | `scene_images` |
| 3 | PUT | `/api/v1/projects/:id/scenes/:sceneId` | 更新场景 | `scenes` |
| 3 | GET | `/api/v1/projects/:id/characters` | 获取角色列表 | `characters`, `character_images` |
| 3 | POST | `/api/v1/projects/:id/characters/:charId/generate` | 生成角色图片 | `character_images` |
| 3 | PUT | `/api/v1/projects/:id/characters/:charId` | 更新角色 | `characters` |
| 3 | GET | `/api/v1/projects/:id/props` | 获取道具列表 | `props` |
| 3 | POST | `/api/v1/projects/:id/props/:propId/generate` | 生成道具图片 | `props` |
| 3 | PUT | `/api/v1/projects/:id/props/:propId` | 更新道具 | `props` |
| 4 | POST | `/api/v1/projects/:id/storyboards/generate` | AI 生成分镜 | `storyboards` |
| 4 | GET | `/api/v1/projects/:id/storyboards` | 获取分镜列表 | `storyboards` |
| 4 | PUT | `/api/v1/projects/:id/storyboards/:shotId` | 更新分镜 | `storyboards` |
| 4 | DELETE | `/api/v1/projects/:id/storyboards/:shotId` | 删除分镜 | `storyboards` |
| 5 | POST | `/api/v1/projects/:id/storyboard-videos/generate` | 批量生成视频 | `storyboard_videos` |
| 5 | GET | `/api/v1/projects/:id/storyboard-videos` | 获取视频列表及状态 | `storyboard_videos` |
| 5 | POST | `/api/v1/projects/:id/storyboard-videos/:videoId/retry` | 重试视频生成 | `storyboard_videos` |
| 6 | POST | `/api/v1/projects/:id/voiceovers/generate` | 批量生成配音 | `voiceovers` |
| 6 | GET | `/api/v1/projects/:id/voiceovers` | 获取配音列表及状态 | `voiceovers` |
| 6 | PUT | `/api/v1/projects/:id/voiceovers/:voId` | 更新配音参数 | `voiceovers` |
| 6 | POST | `/api/v1/projects/:id/voiceovers/:voId/retry` | 重试配音生成 | `voiceovers` |
| 7 | GET | `/api/v1/projects/:id/timeline` | 获取时间线 | `timelines`, `timeline_tracks`, `timeline_clips` |
| 7 | PUT | `/api/v1/projects/:id/timeline` | 保存时间线编排 | `timelines`, `timeline_tracks`, `timeline_clips` |
| 7 | POST | `/api/v1/projects/:id/export` | 发起视频导出 | — |
| 7 | GET | `/api/v1/projects/:id/export/status` | 查询导出进度 | — |

## 文档索引

- [模式选择](./模式选择.md)
- [Step 1 — 项目全局参数确定](./step-1-项目全局参数.md)
- [Step 2 — 故事设定](./step-2-故事设定.md)
- [Step 3 — 场景 / 角色 / 道具](./step-3-场景角色道具.md)
- [Step 4 — 分镜脚本](./step-4-分镜脚本.md)
- [Step 5 — 批量生成分镜视频](./step-5-批量生成分镜视频.md)
- [Step 6 — 批量生成配音](./step-6-批量生成配音.md)
- [Step 7 — 视频预览](./step-7-视频预览.md)
