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
```

默认启用后端不可用时的本地模拟数据兜底。联调阶段如需强制暴露接口错误：

```bash
export VITE_ENABLE_MOCK_FALLBACK=false
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

生产库初始化脚本位于：

```text
deploy/sql/postgresql/schema.sql
```

## 关键设计原则

- 高频变化点通过接口、配置、适配器或事件隔离。
- 发布平台差异只能进入发布适配器，不污染发布中心主流程。
- AI 模型通过 `AiProvider` 接口接入，不绑定具体供应商。
- DTO、VO、Entity 分离，避免数据库变化直接影响前端接口。
- Token、Cookie 等凭据加密存储、脱敏展示、全程审计。
