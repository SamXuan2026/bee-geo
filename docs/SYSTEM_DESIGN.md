# bee-geo 系统设计

## 1. 架构原则

- 采用模块化单体，避免首版过早微服务化。
- 模块内部采用六边形 MVC，隔离业务核心与外部实现。
- 模块之间通过应用服务接口或领域事件协作，不直接访问对方 Repository。
- 高频变化点必须使用接口、配置、适配器或事件隔离。

## 2. 后端分层

```text
Controller
  -> Application Service
  -> Domain Service
  -> Port
  -> Adapter / Repository
```

## 3. 业务模块

| 模块 | 职责 |
| --- | --- |
| auth | 登录、用户、角色、权限 |
| geo | GEO 任务、模拟问题、引用结果 |
| creation | AI 内容草稿、审核、正文编辑 |
| persona | AI 人设生成和结构化编辑 |
| knowledge | 知识库文档和分组 |
| asset | 素材文件和标签 |
| publish | 发布任务、排期、重试、回执 |
| integration | 自有站点和免费媒体授权 |
| audit | 操作审计 |

## 4. 可扩展接口

```text
AiProvider
  - generateGeoQuestions
  - analyzeReferences
  - generateArticle
  - generatePersona

PublishAdapter
  - supportPlatform
  - validateCredential
  - publish
  - revoke

CredentialPort
  - encryptAndSave
  - loadMasked
  - loadPlainForPublish
  - markExpired

FileStoragePort
  - upload
  - download
  - delete
```

## 5. 发布中心状态机

状态配置默认放在后端配置文件中，后续可迁移至数据库。

```text
DRAFT
PENDING_REVIEW
APPROVED
SCHEDULED
PUBLISHING
PUBLISHED
FAILED
MANUAL_REQUIRED
REVOKED
REJECTED
```

## 6. 安全设计

- 凭据加密存储，前端永不返回明文。
- 发布、授权、撤回、重试必须记录审计日志。
- 文件上传限制类型、大小和存储路径。
- 后端统一响应和异常处理，不暴露敏感堆栈。

## 7. 私有化部署

- 所有依赖支持内网安装或离线包交付。
- 文件存储默认 MinIO，也支持本地存储适配。
- 发布渠道不可用时，系统主功能降级运行。
