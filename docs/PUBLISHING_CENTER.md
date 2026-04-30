# 自动化发布中心设计

## 1. 目标

发布中心负责从审核通过内容到多渠道发布的完整闭环，包括排期、执行、重试、人工介入、回执和审计。

## 2. 核心对象

| 对象 | 说明 |
| --- | --- |
| 发布账号 | 自有站点或免费媒体账号，保存授权状态 |
| 发布任务 | 一次内容发布计划 |
| 发布回执 | 平台返回的发布结果、URL、外部 ID |
| 发布适配器 | 对接不同平台的实现 |
| 凭据 | Token、Cookie 等敏感授权信息 |

## 2.1 当前落地范围

- 已落地 `publish_accounts`、`publish_tasks`、`publish_receipts` 三张表。
- 已落地发布任务创建、筛选、详情、重试、撤回、回执查询接口。
- 已落地到期发布调度器，支持自动执行已排期任务和自动重试失败任务。
- 已落地 `PublishAdapter` 抽象，首版包含自有站点和免费媒体两个适配器。
- 已落地 `CredentialPort` 凭据端口和 JPA 加密持久化实现，接口只返回脱敏值。

## 3. 任务流程

```text
审核通过
  -> 创建发布任务
  -> 选择平台和账号
  -> 设置发布时间
  -> 到时进入发布中
  -> 调用 PublishAdapter
  -> 成功保存回执
  -> 失败自动重试
  -> 超过阈值转人工介入
```

## 4. 失败处理

- 默认重试次数：3 次。
- 默认重试间隔：5 分钟、15 分钟、30 分钟。
- 网络异常、限流、平台短暂不可用可重试。
- 授权失效、内容违规、平台字段缺失直接转人工介入。

## 5. 适配器接口

```java
public interface PublishAdapter {
    String platformCode();
    boolean validateCredential(PublishCredential credential);
    PublishReceipt publish(PublishCommand command);
    PublishReceipt revoke(String externalPublishId);
}
```

## 6. 安全要求

- 凭据仅在发布执行时由后端解密。
- 接口只返回脱敏凭据。
- 所有授权变更、发布执行、失败重试必须审计。
- 发布任务不得重复执行同一个平台外部 ID。
- 生产环境必须替换 `bee-geo.security.credential-secret`，并通过内网密钥管理或环境变量注入。

## 7. 当前接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/publish/tasks` | 查询发布任务，支持 `keyword`、`platformCode`、`status` |
| GET | `/api/publish/tasks/{id}` | 查询发布任务详情 |
| GET | `/api/publish/tasks/accounts` | 查询可用于创建任务的发布账号 |
| POST | `/api/publish/tasks` | 创建发布排期 |
| POST | `/api/publish/tasks/{id}/retry` | 人工触发重试或重新发布 |
| POST | `/api/publish/tasks/{id}/revoke` | 撤回本地排期或调用适配器撤回外部发布 |
| GET | `/api/publish/tasks/{id}/receipts` | 查询任务回执列表 |
| POST | `/api/publish/tasks/dispatch` | 手动触发一次到期任务调度，供内网运维和联调使用 |

## 8. 调度配置

```yaml
bee-geo:
  publish:
    scheduler:
      enabled: true
      initial-delay-ms: 10000
      fixed-delay-ms: 30000
      retry-delay-seconds: 300
```

- `enabled`：是否启用自动发布调度器。
- `initial-delay-ms`：应用启动后首次调度延迟。
- `fixed-delay-ms`：每轮调度之间的间隔。
- `retry-delay-seconds`：失败任务自动重试前的最小等待时间。
