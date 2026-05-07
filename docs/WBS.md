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
| A23 | 前端点击交互补齐 | 页面原型 | 按钮反馈、详情弹窗、删除确认、搜索筛选 | frontend/src/app、frontend/src/features | 页面主要按钮点击后有明确反馈或流程推进，不再出现静态死按钮 | A05-A10 |
| A24 | 本地兜底持久化 | API 兜底策略 | 浏览器本地存储、跨页面数据同步 | frontend/src/shared、frontend/src/features | 后端不可用时，新增、编辑、删除、授权、排期、回执刷新后不丢失 | A23 |
| A25 | 前端冒烟检查 | A23、A24 | 页面冒烟脚本和 npm 命令 | frontend/scripts、frontend/package.json | 能自动检查死按钮、受控表单、关键兜底和主链路标记 | A23、A24 |
| A26 | 审计日志前端闭环 | 安全审计要求 | 审计日志页面、查询接口、本地审计写入 | frontend/src/features/audit、frontend/src/shared、frontend/src/app | 关键本地操作可追加审计日志，审计页可筛选、查看详情 | A24、A25 |
| A27 | 权限矩阵前端闭环 | 权限模型要求 | 权限矩阵页面、角色筛选、风险等级展示 | frontend/src/features/permission、frontend/src/app | 可查看角色权限点、风险等级和后端保护状态 | A26 |
| A28 | 权限矩阵后端接口 | A27 | 权限矩阵查询接口和服务 | backend/src/main/java/com/beegeo/common/security、frontend/src/features/permission | 前端权限矩阵优先读取后端 `/api/security/permissions`，支持关键词、角色、风险筛选 | A27 |
| A29 | 后端权限接口测试 | A28 | JUnit 测试、后端测试脚本、Mockito 本地适配 | backend/src/test、scripts/backend-test.sh | 权限矩阵查询和筛选测试通过，避免依赖受限本机 curl 验证 | A28 |
| A30 | 审计日志分页筛选 | 审计增强要求 | 分页响应、审计分页接口、时间范围筛选、前端分页控件 | backend/common/api、backend/common/audit、frontend/src/features/audit | 审计日志支持关键词、结果、起止日期、页码和每页条数筛选 | A26、A29 |
| A31 | 审计日志导出 | 审计留痕要求 | CSV 导出接口、前端导出预览、本地兜底导出 | backend/common/audit、frontend/src/features/audit | 当前筛选条件下的审计日志可导出为 CSV 内容，后端不可用时可用本地审计数据导出 | A30 |
| A32 | 浅色拟态 UI 主题 | 参考图视觉要求 | 浅蓝背景、青绿色主色、拟态卡片、紧凑导航和状态标签 | frontend/src/app/styles.css | 前端整体视觉贴近参考图的工业监控台风格，构建和页面冒烟检查通过 | A23、A25 |
| A33 | 总览监控台组件化 | 参考图仪表盘要求 | 环境仪表、控制开关、趋势图、告警分布、移动端适配 | frontend/src/features/dashboard、frontend/src/app/styles.css | 首页从业务列表升级为监控台视图，窄屏不挤压，页面冒烟和构建通过 | A32 |
| A34 | GEO 监控面板化 | 主链路视觉增强 | GEO 信号指标、引用覆盖环、来源占比、任务状态控制块 | frontend/src/features/geo、frontend/src/app/styles.css | GEO 分析页形成监控面板 + 明细列表结构，原创建、筛选、查看、删除、转创作流程可用 | A32、A33 |
| A35 | 主链路视觉收尾 | 视觉一致性要求 | AI 创作监控面板、发布监控面板、完成度环、发布健康环 | frontend/src/features/creation、frontend/src/features/publish、frontend/src/app/styles.css | 总览、GEO、AI 创作、发布中心四个主链路页形成统一浅色拟态监控台风格 | A33、A34 |
| A36 | 核心面板冒烟加固 | 回归验证要求 | 冒烟脚本增加监控台结构标记校验 | frontend/scripts/page-smoke.mjs | 自动校验首页、GEO、AI 创作、发布中心核心监控面板不被误删 | A25、A35 |
| A37 | 审计接口后端测试 | 审计回归要求 | 审计分页与 CSV 导出服务测试 | backend/src/test/java/com/beegeo/common/audit | 覆盖分页参数边界、排序、CSV 表头和双引号转义，后端测试通过 | A30、A31 |
| A38 | 发布任务服务后端测试 | 发布回归要求 | 发布任务创建、重试成功、超过重试上限转人工测试 | backend/src/test/java/com/beegeo/publish/application | 覆盖标题正文裁剪、重试上限归一化、回执保存、发布成功状态流转、人工介入状态流转和审计事件 | A16、A18、A37 |
| A39 | AI 创作服务后端测试 | 创作回归要求 | 创作草稿、审核、排期服务测试 | backend/src/test/java/com/beegeo/creation/application | 覆盖创建草稿、提交审核、审核通过、审核通过后创建发布排期、未审核禁止排期和审计事件 | A21、A22、A38 |
| A40 | GEO 服务后端测试 | GEO 回归要求 | GEO 任务创建、结果保存、转创作草稿服务测试 | backend/src/test/java/com/beegeo/geo/application | 覆盖关键词裁剪、AI 问题生成、GEO 结果落库、空结果禁止转草稿、转创作正文引用问题和审计事件 | A20、A21、A39 |
| A41 | 配置资产接口权限加固 | 权限覆盖要求 | 关键词、知识库、素材、人设写接口角色限制和反射测试 | backend/src/main/java、backend/src/test/java/com/beegeo/common/security | 配置资产类新增、编辑、删除、AI 人设生成接口仅允许超级管理员和内容管理员，后端测试通过 | A27、A40 |
| A42 | 前端按钮级权限控制 | 权限闭环要求 | 角色切换、模块访问限制、敏感按钮禁用和冒烟标记 | frontend/src/app、frontend/src/shared、frontend/src/features | 前端按当前角色禁用 GEO、创作、发布、集成、配置资产和用户管理写操作，页面冒烟和构建通过 | A27、A41 |
| A43 | 凭据加密后端测试 | 凭据安全回归要求 | 加密服务测试、JPA 凭据适配器测试 | backend/src/test/java/com/beegeo/integration | 覆盖 AES-GCM 加解密、非法密文、错误密钥、凭据加密保存、脱敏读取、发布解密、平台不匹配和过期标记 | A19、A42 |
| A44 | 配置资产服务后端测试 | 基础数据回归要求 | 关键词、知识库、素材服务测试 | backend/src/test/java/com/beegeo/keyword、backend/src/test/java/com/beegeo/knowledge、backend/src/test/java/com/beegeo/asset | 覆盖创建裁剪、空值归一化、默认启用、更新保留启用状态、删除和审计事件 | A41、A43 |
| A45 | 用户与人设服务后端测试 | 基础服务回归要求 | 用户服务测试、AI 人设服务测试 | backend/src/test/java/com/beegeo/auth、backend/src/test/java/com/beegeo/persona | 覆盖用户账号唯一性、角色映射、默认状态、用户更新删除审计、人设空值归一化、默认启用和人设更新删除审计 | A41、A44 |
| A46 | 私有化部署检查 | 部署验证要求 | Compose PostgreSQL 服务、生产环境变量注入、部署检查脚本和 README 说明 | deploy、scripts、README.md | 部署前可自动检查前端产物、Nginx 代理、生产密钥注入、数据库初始化表和核心服务配置 | A15、A45 |
| A47 | 主链路回归检查 | 端到端回归准备 | 零依赖主链路检查脚本和 npm 命令 | frontend/scripts、frontend/package.json、README.md | 可检查 GEO、创作、审核、排期、发布、回执、审计和权限链路关键入口、API 契约、本地兜底和权限标记 | A25、A46 |
| A48 | 凭据操作审计补强 | 凭据安全回归要求 | 凭据保存和过期审计事件、适配器测试断言 | backend/src/main/java/com/beegeo/integration、backend/src/test/java/com/beegeo/integration | 发布账号重新授权和凭据过期操作均写入审计日志，后端测试通过 | A43、A47 |
| A49 | 运行态 API 冒烟检查 | 联调验收要求 | 零依赖只读 API 冒烟脚本和 README 说明 | scripts、README.md | 可对运行中的后端检查健康、基础数据、GEO、创作、发布、集成、权限和审计接口，且不写入业务数据 | A47、A48 |
| A50 | 前端交互契约检查 | 点击回归要求 | 交互契约脚本、页头类型加固和 npm 命令 | frontend/src/shared、frontend/scripts、frontend/package.json、README.md | 可检查核心按钮、弹窗、表单、分页、导出、授权和发布链路均绑定明确动作，构建阶段阻止页头操作按钮缺少点击函数 | A23、A42、A49 |
| A51 | 浏览器点击冒烟检查 | 真实点击验收要求 | Chrome Headless 点击脚本和 npm 命令 | frontend/scripts、frontend/package.json、README.md | 可启动前端静态产物和 Chrome Headless，真实点击导航、GEO、创作、审核、排期、发布、回执、授权、审计导出和角色切换并校验反馈 | A50 |
| A52 | 浏览器点击无端口模式 | 沙箱与本地兼容要求 | 点击脚本 file 模式、Chrome 启动诊断和 README 说明 | frontend/scripts、README.md | 浏览器点击脚本默认通过 `file://` 打开构建产物，不依赖前端静态服务端口；Chrome 提前退出时输出退出码、信号和诊断信息 | A51 |
| A53 | 后端 API 集成测试 | 运行态路由验收要求 | SpringBoot MockMvc 集成测试 | backend/src/test/java/com/beegeo/common/api | 覆盖健康、基础数据、GEO、创作、发布、集成、权限、审计导出、权限拒绝、凭据脱敏和主链路排期路由，后端测试通过 | A49、A52 |
| A54 | 运行态验收脚本契约修复 | A53 后端真实契约 | API 冒烟脚本断言修正和验收限制记录 | scripts、docs | 审计导出断言与后端当前 CSV 类型、表头一致；脚本语法校验通过；沙箱端口访问限制已记录，便于本机终端复验 | A49、A53 |
| A55 | 本机运行态验收编排 | P0 运行态闭环要求 | 后端启动、健康等待、API 冒烟、前端构建、浏览器点击和清理编排脚本 | scripts、README.md、docs | 可通过单条脚本在本机终端完成完整运行态验收；支持跳过浏览器、跳过 API、使用已有后端、保留后端和调整等待时间 | A54 |
| A56 | 自有站点 HTTP 发布适配器 | P0 真实发布接入要求 | 可开关的自有站点 HTTP 发布实现和适配器测试 | backend/src/main/java/com/beegeo/publish、backend/src/test/java/com/beegeo/publish、README.md | `OWNED_SITE` 可在显式启用后按账号 endpoint 发起真实 HTTP 发布；默认保留演示回执防止误发；后端测试通过 | A55 |
| A57 | DeepSeek 真实数据联调加固 | 真实 AI 联调要求 | AI Provider 显式切换、Provider 状态接口、结构化 GEO 分析结果、前端运行模式提示、前端关闭兜底命令、DeepSeek 写入式冒烟脚本、一键运行态验收脚本、DeepSeek 官方端点和 HTTP/1.1 调用加固 | backend/common/ai、backend/geo、frontend、scripts、README.md | 启用 `BEE_GEO_AI_PROVIDER=deepseek` 后 GEO 任务使用真实 DeepSeek 结构化输出；`/api/ai/provider` 和 GEO 页面可查看当前模型来源；GEO 页面明确显示当前是本地兜底模式还是真实接口模式；前端可通过 `npm run dev:real` 关闭本地兜底；`./scripts/deepseek-smoke.sh` 可校验结果来源为 DeepSeek、包含问题/标题/说明且无本地假链接；`./scripts/deepseek-runtime-smoke.sh` 可一键启动后端、执行真实写入检查和前端真实模式构建；AI 调用异常返回 `AI_PROVIDER_ERROR` 明确原因 | A56 |

## 当前交付

本次实现覆盖 A01-A57 的第一版骨架、发布中心持久化联调、自动调度、凭据加密持久化、GEO/AI 创作到发布排期主链路、前端可交互 MVP、前端冒烟检查、审计日志前端闭环、权限矩阵前端闭环、权限矩阵后端接口、后端权限接口测试、审计日志分页筛选、审计日志导出、浅色拟态 UI 主题、总览监控台组件化、GEO 监控面板化、主链路视觉收尾、核心面板冒烟加固、审计接口后端测试、发布任务服务后端测试、AI 创作服务后端测试、GEO 服务后端测试、配置资产接口权限加固、前端按钮级权限控制、凭据加密后端测试、配置资产服务后端测试、用户与人设服务后端测试、私有化部署检查、主链路回归检查、凭据操作审计补强、运行态 API 冒烟检查、前端交互契约检查、浏览器点击冒烟检查、浏览器点击无端口模式、后端 API 集成测试、运行态验收脚本契约修复、本机运行态验收编排、自有站点 HTTP 发布适配器和 DeepSeek 真实数据联调加固。当前前端在后端不可用时仍支持本地兜底演示；联调真实 DeepSeek 时必须关闭前端兜底并执行 `./scripts/deepseek-smoke.sh` 验证，生产级验收还需在本机终端或授权环境完整执行 `./scripts/runtime-smoke.sh`，并使用真实自有站点 endpoint 做发布联调。
