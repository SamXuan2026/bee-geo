# WBS 与 AI 执行任务

## 任务规则

- 单个任务只负责一个模块或一个能力。
- 每个任务必须有目标、输入、输出、修改范围、验收标准和依赖。
- 高频变化点必须通过接口、配置、适配器或事件隔离。

## 任务清单

| 编号 | 任务 | 输入 | 输出 | 修改范围 | 验收标准 | 依赖 |
| --- | --- | --- | --- | --- | --- | --- |
| A01 | 建立项目骨架 | 迭代计划 | 前后端和文档目录 | 根目录 | 目录隔离清晰 | 无 |
| A02 | 编写 PRD | 原型分析 | PRD 文档 | docs | 覆盖 23 个画板 | A01 |
| A03 | 编写系统设计 | 架构约束 | 系统设计文档 | docs | 服务边界明确 | A02 |
| A04 | 编写发布中心设计 | 发布策略 | 发布专项文档 | docs | 状态、重试、回执完整 | A03 |
| A05 | 搭建前端骨架 | React/Vite | 可运行前端 | frontend | 构建通过 | A01 |
| A06 | 实现后台布局 | 页面清单 | 侧边栏和顶部栏 | frontend/src/app | 菜单切换可用 | A05 |
| A07 | 实现总览页 | 指标数据 | 仪表盘 | dashboard | 指标和待办展示 | A06 |
| A08 | 实现 GEO 页 | mock 数据 | GEO 列表和结果 | geo | 可进入创作 | A06 |
| A09 | 实现 AI 创作页 | mock 数据 | 草稿和审核状态 | creation | 可进入发布设置 | A08 |
| A10 | 实现发布中心页 | mock 数据 | 任务、重试、回执 | publish | 发布闭环可演示 | A09 |
| A11 | 搭建后端骨架 | SpringBoot | 后端模块结构 | backend | 源码结构完整 | A01 |
| A12 | 设计发布适配器接口 | 发布设计 | PublishAdapter | backend/publish | 平台实现可替换 | A11 |
| A13 | 设计 AI Provider 接口 | AI 设计 | AiProvider | backend/common | 模型可替换 | A11 |
| A14 | 设计凭据服务接口 | 安全要求 | CredentialPort | backend/integration | 凭据隔离 | A11 |
| A15 | 输出部署配置 | 私有化要求 | Nginx 配置和说明 | deploy/docs | 可用于内网部署 | A01 |
| A16 | 发布任务持久化 | 发布中心设计 | 任务、账号、回执表和 API | backend/publish、resources | 发布任务可创建、重试、撤回、查询回执 | A11、A12、A14 |
| A17 | 发布中心前端联调 | A16 接口 | 发布中心真实 API 优先、mock 兜底 | frontend/src/features/publish | 页面支持筛选、创建、重试、撤回、回执查看 | A10、A16 |
| A18 | 发布任务自动调度 | A16 接口 | 到期任务调度器和手动触发接口 | backend/publish | 到期排期任务可自动执行，失败任务可按间隔自动重试 | A16 |
| A19 | 凭据加密持久化 | 安全要求 | 凭据密文表、加密服务、集成设置联调 | backend/integration、frontend/src/features/integration | 凭据不落明文，列表只脱敏展示，重新授权可更新账号状态 | A14、A16 |
| A20 | GEO 任务持久化 | 第 4 迭代 | GEO 任务、结果表和接口 | backend/geo、resources | GEO 任务可创建、查询，结果可持久化 | A11、A13 |
| A21 | GEO 转创作草稿 | A20 接口 | 创作草稿表、审核接口和前端联调 | backend/creation、frontend/src/features/geo、frontend/src/features/creation | GEO 结果可生成草稿，草稿可提交审核和审核通过 | A20 |
| A22 | 创作到发布排期联动 | A21 接口 | 内容编辑保存和创建发布排期接口 | backend/creation、frontend/src/features/creation | 审核通过内容可保存正文并创建发布任务 | A16、A21 |

## 当前交付

本次实现覆盖 A01-A22 的第一版骨架、发布中心持久化联调、自动调度、凭据加密持久化与 GEO/AI 创作到发布排期主链路，可作为后续 AI 小任务继续迭代。
