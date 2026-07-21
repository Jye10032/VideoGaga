# Step 2 — 故事设定（剧本）

## 基本信息

| 字段 | 内容 |
| --- | --- |
| 页面 | 故事设定 |
| 路由 | `/workflows/pro/step-2` |
| 涉及表 | `scripts` |
| 更新日期 | 2026-02-08 |

## 功能说明

用户在此页面完成剧本文本创作，有两种模式可切换：

### 模式 A：AI 扩写

1. 用户输入灵感描述，点击"发送"
2. 后端 AI 生成完整故事设定，返回结果显示在左侧对话区
3. 用户可多轮对话迭代
4. 用户点击 AI 回复旁的"应用到草稿"，填入右侧草稿区
5. 用户编辑草稿后点击"提交"定稿

### 模式 B：自己写

1. 用户直接在文本区撰写完整剧本
2. 点击"提交"定稿

### 定稿后

- 页面切换为只读展示 + "重新编辑"按钮
- 底部出现"下一步"导航
- 点击"重新编辑"可撤销定稿

## 需要的接口

### 1. AI 扩写剧本

**前端触发时机**：AI 模式下用户点击"发送"。

```
POST /api/v1/projects/:id/script/generate
```

**Request：**

```json
{
  "messages": [
    { "role": "user", "content": "一个关于两只小动物分别与重逢的故事" },
    { "role": "ai", "content": "（上一轮 AI 回复）" },
    { "role": "user", "content": "加入樱花和季节变化的元素" }
  ]
}
```

**Response：**

```json
{
  "message": {
    "role": "ai",
    "content": "基于你的描述生成的故事设定：\n\n在Chiikawa宁静的世界里……"
  }
}
```

> 如需流式输出（SSE），前端已预留逐字渲染位置。

### 2. 保存/定稿剧本

**前端触发时机**：用户点击"提交"按钮。

```
PUT /api/v1/projects/:id/script
```

**Request（写入 `scripts` 表）：**

```json
{
  "original_content": "用户最终定稿的剧本全文……"
}
```

| 字段 | 对应 `scripts` 表字段 | 说明 |
| --- | --- | --- |
| `original_content` | `original_content` | 用户输入的原始剧本内容 |

> 后端收到后可异步调用 AI 处理，将结果写入 `processed_content`。
> 同时将 `workflow_nodes` 表中 step=2 标记为 `confirmed`，`projects.current_step` 更新为 3。

**Response（对应 `scripts` 表）：**

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "original_content": "用户最终定稿的剧本全文……",
  "processed_content": null,
  "dialogues": null,
  "extracted_scenes": null,
  "extracted_characters": null,
  "extracted_props": null,
  "version": 1,
  "created_at": "2026-02-08T10:10:00Z",
  "updated_at": "2026-02-08T10:10:00Z"
}
```

### 3. 读取剧本

**前端触发时机**：页面加载时调用，回显已保存的剧本。

```
GET /api/v1/projects/:id/script
```

**Response**：同上述 `scripts` 表结构。404 表示尚未创建。

## 当前状态

前端 UI 已完成。AI 回复目前为 mock 数据，剧本暂存 localStorage。接口就绪后替换为 API 调用。
