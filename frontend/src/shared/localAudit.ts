import type { AuditLogItem } from "./types";
import { readLocalItems, writeLocalItems } from "./localStore";

export const AUDIT_LOGS_KEY = "bee-geo:fallback-audit-logs";

const defaultAuditLogs: AuditLogItem[] = [
  {
    id: 1,
    module: "发布中心",
    action: "重试发布任务",
    targetId: "2",
    operatorAccount: "admin",
    operatorName: "系统管理员",
    operatorRole: "SUPER_ADMIN",
    clientIp: "127.0.0.1",
    requestUri: "/api/publish/tasks/2/retry",
    success: false,
    createdAt: "2026-04-30 10:20",
  },
  {
    id: 2,
    module: "集成设置",
    action: "更新授权凭据",
    targetId: "cnblogs",
    operatorAccount: "admin",
    operatorName: "系统管理员",
    operatorRole: "SUPER_ADMIN",
    clientIp: "127.0.0.1",
    requestUri: "/api/integrations/accounts",
    success: true,
    createdAt: "2026-04-30 09:42",
  },
  {
    id: 3,
    module: "AI 创作",
    action: "审核通过",
    targetId: "1",
    operatorAccount: "admin",
    operatorName: "系统管理员",
    operatorRole: "SUPER_ADMIN",
    clientIp: "127.0.0.1",
    requestUri: "/api/creations/1/approve",
    success: true,
    createdAt: "2026-04-30 09:15",
  },
];

export function listLocalAuditLogs() {
  return readLocalItems<AuditLogItem>(AUDIT_LOGS_KEY, defaultAuditLogs);
}

export function recordLocalAudit(module: string, action: string, targetId?: string, success = true, requestUri = "/local/fallback") {
  const item: AuditLogItem = {
    id: Date.now(),
    module,
    action,
    targetId,
    operatorAccount: "admin",
    operatorName: "系统管理员",
    operatorRole: "SUPER_ADMIN",
    clientIp: "127.0.0.1",
    requestUri,
    success,
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
  };
  writeLocalItems(AUDIT_LOGS_KEY, [item, ...listLocalAuditLogs()]);
  return item;
}
