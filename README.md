# bee-geo

bee-geo 是面向企业私有化部署的 GEO 分析、AI 内容创作与自动化发布后台。

## 项目目标

- 打通 `GEO 分析 -> AI 创作 -> 审核 -> 定时发布 -> 回执审计` 主链路。
- 保持模块边界清晰，需求频繁变化时只修改局部模块、配置或适配器。
- 首版采用模块化单体，不拆微服务，降低私有化部署复杂度。

## 技术架构

- 前端：React + Vite + TypeScript。
- 后端：SpringBoot 模块化单体，采用六边形 MVC。
- 数据库：PostgreSQL 或 MySQL。
- 队列：Redis 延迟任务或轻量任务表轮询。
- 文件存储：MinIO 或本地对象存储适配。
- 部署：Nginx + SpringBoot + 数据库 + Redis + MinIO。

## 目录结构

```text
bee-geo/
├── docs/       设计文档、PRD、WBS、接口草案
├── frontend/   React 管理后台原型
├── backend/    SpringBoot 后端骨架
└── deploy/     私有化部署配置
```

## 文档索引

- `docs/PRD.md`：产品需求文档。
- `docs/SYSTEM_DESIGN.md`：系统设计和模块边界。
- `docs/PUBLISHING_CENTER.md`：自动化发布专项设计。
- `docs/UI_SPEC.md`：界面视觉规范。
- `docs/WBS.md`：AI 可执行任务拆分。
- `docs/ROADMAP.md`：迭代路线图。

## 本地前端预览

```bash
cd frontend
npm run dev
```

前端默认请求后端：

```text
http://127.0.0.1:8088/api
```

如需覆盖接口地址，可在启动前设置：

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8088/api
export VITE_OPERATOR_ACCOUNT=13677889001
```

默认启用后端不可用时的本地模拟数据兜底。联调阶段如需强制暴露接口错误：

```bash
export VITE_ENABLE_MOCK_FALLBACK=false
```

联调真实 DeepSeek 返回数据时，前端必须关闭本地兜底，否则后端未启动、DeepSeek Key 错误或接口异常会被本地数据掩盖。

真实联调前端启动：

```bash
./scripts/frontend-real.sh
```

前端回归检查：

```bash
cd frontend
npm run page-smoke
npm run interaction-smoke
npm run flow-smoke
npm run build
npm run browser-click-smoke
```

其中 `interaction-smoke` 会检查核心按钮、弹窗、表单、分页、审计导出、授权和发布链路是否绑定到明确动作；`flow-smoke` 会检查 `GEO 分析 -> AI 创作 -> 审核 -> 发布排期 -> 发布中心 -> 回执 -> 审计/权限` 主链路关键入口、API 契约、本地兜底和权限标记。

`browser-click-smoke` 默认使用 `file://` 直开构建产物并启动 Chrome Headless，真实点击导航、GEO、创作、审核、排期、发布、回执、授权、审计导出和角色切换。该命令依赖本机 Chrome/Chromium；如 Chrome 不在默认路径，可指定：

```bash
export BEE_GEO_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npm run browser-click-smoke
```

如需改为本机静态服务模式：

```bash
export BEE_GEO_BROWSER_MODE=server
export BEE_GEO_BROWSER_PORT=4188
npm run browser-click-smoke
```

## 本地后端运行

```bash
source ./env.sh
./scripts/backend-compile.sh
./scripts/backend-dev.sh
```

后端默认地址：

```text
http://127.0.0.1:8088
```

健康检查：

```bash
curl -s http://127.0.0.1:8088/api/health
```

运行态 API 冒烟检查：

```bash
./scripts/api-smoke.sh
```

默认检查 `http://127.0.0.1:8088`，使用 `13677889001` 作为操作人请求头。需要检查其他地址或操作人时：

```bash
export BEE_GEO_API_BASE=http://127.0.0.1:8088
export BEE_GEO_SMOKE_OPERATOR=13677889001
./scripts/api-smoke.sh
```

该脚本只读检查健康、基础数据、GEO、创作、发布、集成、权限矩阵和审计导出接口，不写入业务数据。

完整运行态验收：

```bash
./scripts/runtime-smoke.sh
```

该脚本会启动本地后端、等待健康检查、执行 API 冒烟检查、构建前端并执行浏览器点击冒烟检查，结束后默认停止脚本启动的后端进程。

常用开关：

```bash
export BEE_GEO_RUNTIME_BROWSER=false      # 只验 API，不跑浏览器点击
export BEE_GEO_RUNTIME_API=false          # 只跑前端浏览器点击
export BEE_GEO_RUNTIME_START_BACKEND=false # 使用已启动后端
export BEE_GEO_RUNTIME_KEEP_BACKEND=true  # 验收后保留后端进程
export BEE_GEO_RUNTIME_WAIT_SECONDS=90    # 调整后端健康检查等待时间
```

如需后台启动：

```bash
./scripts/backend-start.sh
./scripts/backend-stop.sh
```

## 数据库配置

默认启用 `dev` 配置，使用 H2 内存数据库，启动时执行 `schema.sql` 和 `data.sql`，便于本地无外部依赖调试。

生产部署使用 PostgreSQL：

```bash
export SPRING_PROFILES_ACTIVE=prod
export BEE_GEO_DB_URL=jdbc:postgresql://127.0.0.1:5432/bee_geo
export BEE_GEO_DB_USERNAME=bee_geo
export BEE_GEO_DB_PASSWORD=请替换为强密码
```

生产环境必须替换凭据加密密钥，建议通过内网密钥管理或环境变量注入：

```bash
export BEE_GEO_CREDENTIAL_SECRET=请替换为高强度随机密钥
```

如需启用 DeepSeek 真实模型调用：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，替换真实密钥：

```bash
BEE_GEO_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=请替换为真实密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro
VITE_ENABLE_MOCK_FALLBACK=false
```

DeepSeek 默认调用地址为：

```text
https://api.deepseek.com/chat/completions
```

如果之前已启动后端，修改 `.env.local` 或升级代码后必须重启后端，否则页面仍会访问旧进程。

后端启动后可执行真实 DeepSeek 写入式联调检查：

```bash
./scripts/deepseek-smoke.sh
```

该脚本会创建 GEO 任务，并校验 DeepSeek 返回的问题、内容标题和分析说明均已持久化到 GEO 结果，且没有本地假链接。

如需一键完成后端启动、健康等待、DeepSeek 写入式检查和前端真实模式构建：

```bash
./scripts/deepseek-runtime-smoke.sh
```

排查当前是否真正接入 AI：

```bash
./scripts/ai-diagnose.sh
```

常用开关：

```bash
export BEE_GEO_DEEPSEEK_RUNTIME_START_BACKEND=false # 使用已有后端
export BEE_GEO_DEEPSEEK_RUNTIME_KEEP_BACKEND=true   # 验收后保留脚本启动的后端
export BEE_GEO_DEEPSEEK_RUNTIME_BUILD_FRONTEND=false # 跳过前端构建
export BEE_GEO_DEEPSEEK_RUNTIME_WAIT_SECONDS=120    # 调整后端等待时间
```

页面和运行态接口可通过以下地址确认当前后端实际启用的 AI Provider：

```text
http://127.0.0.1:8088/api/ai/provider
```

如需启用自有站点真实 HTTP 发布适配器：

```bash
export BEE_GEO_OWNED_SITE_HTTP_ENABLED=true
```

启用后，`OWNED_SITE` 平台会向发布账号 `endpoint` 发送 `POST` 请求。若账号 endpoint 只配置域名或根路径，系统默认请求 `/api/publish/articles`；若 endpoint 已包含路径，则按完整地址请求。未启用时仍使用本地演示回执，避免开发环境误触发外部发布。

生产库初始化脚本位于：

```text
deploy/sql/postgresql/schema.sql
```

## 部署前检查

私有化部署前先执行：

```bash
bash scripts/deploy-check.sh
```

检查内容包括：

- 前端构建产物是否存在。
- Nginx 是否配置前端静态资源和 `/api/` 反向代理。
- Compose 是否包含 PostgreSQL、Redis、MinIO、后端和前端服务。
- 生产数据库密码和凭据加密密钥是否改为环境变量强制注入。
- PostgreSQL 初始化脚本是否包含核心业务表、审计表和凭据表。

## 关键设计原则

- 高频变化点通过接口、配置、适配器或事件隔离。
- 发布平台差异只能进入发布适配器，不污染发布中心主流程。
- AI 模型通过 `AiProvider` 接口接入，不绑定具体供应商。
- DTO、VO、Entity 分离，避免数据库变化直接影响前端接口。
- Token、Cookie 等凭据加密存储、脱敏展示、全程审计。
