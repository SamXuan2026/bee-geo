# API 草案

## 1. 通用响应

```json
{
  "success": true,
  "code": "OK",
  "message": "处理成功",
  "data": {}
}
```

## 2. GEO 分析

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/geo/tasks` | 创建 GEO 分析任务 |
| GET | `/api/geo/tasks` | 查询任务列表 |
| GET | `/api/geo/tasks/{id}` | 查询任务详情和结果 |
| GET | `/api/geo/tasks/{id}/results` | 查询 GEO 结果列表 |
| POST | `/api/geo/tasks/{id}/create-draft` | 基于 GEO 结果创建创作草稿 |

## 3. AI 创作

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/creations` | 创建内容草稿 |
| PUT | `/api/creations/{id}` | 保存编辑内容 |
| POST | `/api/creations/{id}/submit-review` | 提交审核 |
| POST | `/api/creations/{id}/approve` | 审核通过 |
| POST | `/api/creations/{id}/reject` | 审核驳回 |
| POST | `/api/creations/{id}/schedule-publish` | 审核通过内容创建发布排期 |

保存编辑内容请求：

```json
{
  "title": "2026 年 IM 即时通讯方案选型实践",
  "brand": "BeeWorks",
  "platform": "自有站点",
  "summary": "文章摘要",
  "body": "文章正文"
}
```

创建发布排期请求：

```json
{
  "platformCode": "OWNED_SITE",
  "accountId": "site-main",
  "scheduledAt": "2026-04-30T09:00:00",
  "maxRetryCount": 3
}
```

## 4. 发布中心

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/publish/tasks` | 创建发布排期 |
| GET | `/api/publish/tasks` | 查询发布任务 |
| GET | `/api/publish/tasks/{id}` | 查询发布任务详情 |
| GET | `/api/publish/tasks/accounts` | 查询发布账号 |
| POST | `/api/publish/tasks/{id}/retry` | 人工触发重试 |
| POST | `/api/publish/tasks/{id}/revoke` | 撤回发布任务 |
| GET | `/api/publish/tasks/{id}/receipts` | 查询发布回执列表 |
| GET | `/api/publish/tasks/{id}/receipt` | 查询发布回执列表兼容路径 |
| POST | `/api/publish/tasks/dispatch` | 手动触发到期任务调度 |

创建发布任务请求：

```json
{
  "contentId": 1,
  "title": "2026 年 IM 即时通讯方案选型实践",
  "body": "发布正文",
  "platformCode": "OWNED_SITE",
  "accountId": "site-main",
  "scheduledAt": "2026-04-30T09:00:00",
  "maxRetryCount": 3
}
```

## 5. 集成设置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/integrations/sites` | 添加自有站点 |
| POST | `/api/integrations/media` | 添加免费媒体授权 |
| GET | `/api/integrations/accounts` | 查询授权账号 |
| POST | `/api/integrations/accounts` | 保存或刷新账号凭据 |
| POST | `/api/integrations/accounts/expire` | 标记账号凭据过期 |
| POST | `/api/integrations/accounts/{id}/refresh` | 重新授权 |

保存凭据请求：

```json
{
  "accountId": "site-main",
  "platformCode": "OWNED_SITE",
  "secretValue": "token-or-cookie"
}
```

## 6. 基础资产

关键词、知识库、素材、AI 人设均提供标准 CRUD、批量上传和状态查询接口。
