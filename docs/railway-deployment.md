# VideoGaga Railway 部署

VideoGaga 使用独立的 Next.js 网页服务、FastAPI 后端和 PostgreSQL。前后端连接同一 GitHub 仓库的 `main` 分支；数据库只通过项目私网访问。首页保持固定黑色，工作台主题独立切换。

## 服务配置

| 设置 | frontend | VideoGaga 后端 |
| --- | --- | --- |
| 仓库 | `Jye10032/VideoGaga` | `Jye10032/VideoGaga` |
| Root Directory | `/frontend` | 仓库根目录 |
| Builder | Dockerfile，路径 `/frontend/Dockerfile` | 根目录 `Dockerfile` |
| Build Command | Dockerfile 自动构建 | Dockerfile 自动构建 |
| Start Command | `node server.js` | Dockerfile 自动启动，读取 `PORT` |
| PORT | `8080` | `8080` |
| 域名目标端口 | `8080` | `8080` |
| Healthcheck Path | `/` | `/ready` |
| 实例数 | 1 | 1 |

后端 `/health` 检查进程，`/ready` 还检查数据库连接。只有 `/ready` 返回 200 才能作为完整账号服务的部署就绪依据。

2026 年 10 月部署时，Railway 已禁止新服务使用旧 Config as Code；仓库中的 `railway.toml` 和 `frontend/railway.json` 仅保留兼容旧服务。新服务需在 Settings 设置上表参数，或迁移为 `.railway/railway.ts`。参见 [Railway 配置说明](https://docs.railway.com/config-as-code) 与 [单仓库多服务部署](https://docs.railway.com/deployments/monorepo)。

## 环境变量

frontend：

```dotenv
PORT=8080
RAILWAY_DOCKERFILE_PATH=/frontend/Dockerfile
NEXT_PUBLIC_API_BASE_URL=https://${{VideoGaga.RAILWAY_PUBLIC_DOMAIN}}
NEXT_TELEMETRY_DISABLED=1
```

前端使用独立 Node.js 22 Dockerfile，并在容器构建时开启 Next.js standalone 输出。不要让 Railway 使用根目录的 Python Dockerfile 构建前端。构建上下文为 `frontend`；本地可执行 `docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://后端域名 -t videogaga-web frontend`。

`NEXT_PUBLIC_API_BASE_URL` 会在网页构建时写入产物，修改后必须重新构建。它应指向后端 HTTPS 根地址，不要加 `/api/v1`。浏览器无法访问 `.railway.internal`。

VideoGaga 后端：

```dotenv
PORT=8080
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL_MODE=disable
CORS_ALLOWED_ORIGINS=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
GOOGLE_OAUTH_ALLOWED_ORIGINS=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

另外在 Railway Variables 中生成并保存独立的 `JWT_SECRET`（至少 32 个字符）和 `BOOTSTRAP_ADMIN_INVITE`（16–32 个字符）。不要将它们写入仓库、截图或部署日志。数据库采用变量引用，不复制数据库密码。

这里的 `DATABASE_SSL_MODE=disable` 仅用于同一项目内的 `Postgres.DATABASE_URL` 私网连接；Railway 私网通过加密 WireGuard 隧道传输。外部数据库连接保留默认 `verify-full`，不得照搬该私网设置。参见 [Railway 私网说明](https://docs.railway.com/networking/private-networking)。PostgreSQL 使用持久卷，不为其添加公网 TCP 入口。

部署包通过 `.dockerignore` 排除本地 `.env`、SQLite 文件、虚拟环境和前端依赖。

## 首次使用

1. 打开网页域名，在登录界面切换注册。
2. 从后端 Variables 读取 `BOOTSTRAP_ADMIN_INVITE`，自行设置账号和密码。该邀请码只允许一次使用，创建首个管理员。
3. 首个管理员在 `/admin` 创建普通邀请码；其他用户凭邀请码注册。
4. 登录后创建账号项目，刷新确认云端内容保留。模型地址、API Key 和模型 ID 在 `/settings` 按用途配置。

模型 Key 仍由访问者自行提供，仅在当前调用时发送至后端与对应模型供应商。Google 登录还需额外配置 Google OAuth 客户端及其回调地址；仅设置允许的来源域名不会启用 Google 登录。

本地演示保存在访问者浏览器中，`localhost` 的演示项目不会自动出现在 Railway 域名下。线上可以重新创建验收示例；这与登录账号后的云端项目相互独立。

## 发布验收

每次发布检查网页 `/`、`/projects`、后端 `/health` 和 `/ready`，确认都正常响应。检查浏览器请求指向当前后端、允许的网页来源可通过跨域预检、未登录请求不能读取云端项目。首次账号设置后，再检查项目创建和刷新保存。

真实模型生成效果、供应商额度和 Google OAuth 授权需要对应凭据另行验收。浏览器导出需要保持页面可见；供应商临时媒体 URL 的长期归档仍需后续存储方案。
