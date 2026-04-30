# 数据模型草案

## 1. 核心实体

| 实体 | 关键字段 |
| --- | --- |
| 用户 | id、姓名、账号、手机号、角色、状态 |
| 角色 | id、编码、名称、权限集合 |
| 关键词 | id、名称、分组、创建人、更新时间 |
| 知识文档 | id、名称、类型、分组、文件地址、更新时间 |
| 素材 | id、名称、类型、标签、文件地址、更新时间 |
| AI 人设 | id、名称、角色定位、表达重心、核心视角、情感温度 |
| GEO 任务 | id、关键词、状态、问题数、创建人、创建时间 |
| GEO 结果 | id、任务 id、平台、问题、引用标题、URL、媒体、描述 |
| 创作内容 | id、标题、摘要、正文、关键词、状态、审核人 |
| 发布账号 | id、平台、账号名称、授权状态、凭据引用、过期时间 |
| 发布凭据 | id、账号 id、平台、加密密文、过期时间 |
| 发布任务 | id、内容 id、平台、账号 id、计划时间、状态、重试次数 |
| 发布回执 | id、任务 id、外部发布 id、URL、平台响应、发布时间 |
| 审计日志 | id、模块、动作、对象 id、操作人、结果、时间 |

## 1.1 当前已落地发布表

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| publish_accounts | account_id、name、platform_code、platform_name、endpoint、status、expires_at | 发布账号元数据，不保存明文凭据 |
| publish_credentials | account_id、platform_code、encrypted_secret、expired_at | 发布凭据密文，使用后端密钥加密 |
| publish_tasks | content_id、title、body、platform_code、account_id、scheduled_at、status、retry_count、max_retry_count、external_publish_id、publish_url | 发布排期、执行状态和最后回执摘要 |
| publish_receipts | task_id、platform_code、account_id、attempt_no、success、external_publish_id、url、message、published_at | 每次发布、重试、撤回的回执记录 |
| geo_tasks | keyword、status、question_count | GEO 分析任务主表 |
| geo_results | task_id、keyword、question、ai_title、url、media、description | GEO 引用结果和内容机会 |
| creations | geo_task_id、title、brand、platform、summary、body、status、publish_at | AI 创作草稿、正文编辑、审核状态和发布排期时间 |

## 2. 状态枚举

### 内容状态

```text
DRAFT 草稿
PENDING_REVIEW 待审核
APPROVED 审核通过
REJECTED 已驳回
SCHEDULED 已排期
PUBLISHING 发布中
PUBLISHED 发布成功
FAILED 发布失败
MANUAL_REQUIRED 人工介入
REVOKED 已撤回
```

### 授权状态

```text
VALID 有效
EXPIRED 已过期
INVALID 无效
NEED_REAUTH 需要重新授权
```

## 3. 设计要求

- DTO 与 Entity 分离。
- 发布任务与发布回执分表。
- 凭据不与发布账号直接同表明文保存。
- 审计日志只追加，不物理删除。
