import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const srcRoot = join(root, "src");
const failures = [];

function read(path) {
  return readFileSync(join(srcRoot, path), "utf8");
}

function report(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function requireTokens(path, tokens) {
  const source = read(path);
  for (const token of tokens) {
    report(source.includes(token), `${path} 缺少主链路标记：${token}`);
  }
}

function requirePattern(path, pattern, message) {
  report(pattern.test(read(path)), `${path} ${message}`);
}

requireTokens("app/App.tsx", [
  "geo",
  "creation",
  "publish",
  "audit",
  "permission",
  "onCreateDraft={() => setActiveModule(\"creation\")}",
  "onOpenPublish={() => setActiveModule(\"publish\")}",
  "role-switcher",
  "canAccessModule",
]);

requireTokens("features/geo/GeoPage.tsx", [
  "submitTask",
  "createDraft",
  "onCreateDraft",
  "selectedReference",
  "deleteTarget",
  "contentWriteRoles",
  "geo-console",
]);
requireTokens("features/geo/api.ts", [
  "/geo/tasks",
  "/geo/tasks/${taskId}/results",
  "/geo/tasks/${taskId}/create-draft",
  "withMockFallbackFactory",
  "recordLocalAudit(\"GEO 分析\"",
  "writeLocalItems(GEO_TASKS_KEY",
  "writeLocalItems(GEO_REFERENCES_KEY",
]);

requireTokens("features/creation/CreationPage.tsx", [
  "createBlankDraft",
  "regenerateDraft",
  "saveDraft",
  "submitReview",
  "approve",
  "createPublishSchedule",
  "onOpenPublish",
  "reviewRoles",
  "publishRoles",
  "仅审核通过的内容可以创建发布排期",
]);
requireTokens("features/creation/api.ts", [
  "/creations",
  "/submit-review",
  "/approve",
  "/schedule-publish",
  "withMockFallbackFactory",
  "recordLocalAudit(\"AI 创作\"",
  "writeLocalItems(CREATIONS_KEY",
]);

requireTokens("features/publish/PublishPage.tsx", [
  "openCreate",
  "submitTask",
  "retryTask",
  "openReceipts",
  "openRevokeConfirm",
  "confirmRevoke",
  "publishRoles",
  "publish-console",
]);
requireTokens("features/publish/api.ts", [
  "/publish/tasks",
  "/publish/tasks/accounts",
  "/publish/tasks/${id}/retry",
  "/publish/tasks/${id}/revoke",
  "/publish/tasks/${id}/receipts",
  "withMockFallbackFactory",
  "recordLocalAudit(\"发布中心\"",
  "writeLocalItems(FALLBACK_TASKS_KEY",
  "writeLocalItems(FALLBACK_RECEIPTS_KEY",
]);

requireTokens("features/integration/IntegrationPage.tsx", [
  "submitCredential",
  "confirmExpire",
  "publishRoles",
  "请输入新的授权凭据",
]);
requireTokens("features/integration/api.ts", [
  "/integrations/accounts",
  "/integrations/accounts/expire",
  "withMockFallbackFactory",
  "recordLocalAudit(\"集成设置\"",
]);

requireTokens("features/audit/AuditPage.tsx", [
  "listAuditLogPage",
  "exportAuditLogs",
  "selectedItem",
  "审计详情",
]);
requireTokens("features/audit/api.ts", [
  "/audit/logs/page",
  "/audit/logs/export",
  "exportLocalAuditLogs",
  "listLocalAuditLogs",
]);

requireTokens("features/permission/PermissionPage.tsx", [
  "listPermissions",
  "listPermissionRoles",
  "selectedItem",
  "权限详情",
]);
requireTokens("shared/permissions.ts", [
  "contentWriteRoles",
  "reviewRoles",
  "publishRoles",
  "superAdminRoles",
  "canAccessModule",
]);

const backendContracts = [
  ["features/geo/api.ts", /apiPost<GeoTaskResponse>\("\/geo\/tasks"/, "缺少创建 GEO 任务 API 调用"],
  ["features/creation/api.ts", /apiPost<CreationResponse>\(`\/creations\/\$\{id\}\/submit-review`/, "缺少提交审核 API 调用"],
  ["features/creation/api.ts", /apiPost<CreationResponse>\(`\/creations\/\$\{id\}\/approve`/, "缺少审核通过 API 调用"],
  ["features/creation/api.ts", /apiPost<PublishTask>\(`\/creations\/\$\{id\}\/schedule-publish`/, "缺少创作排期 API 调用"],
  ["features/publish/api.ts", /apiPost<PublishTask>\("\/publish\/tasks"/, "缺少创建发布任务 API 调用"],
  ["features/publish/api.ts", /apiPost<PublishActionReceipt>\(`\/publish\/tasks\/\$\{id\}\/retry`/, "缺少重试发布 API 调用"],
  ["features/publish/api.ts", /apiPost<PublishActionReceipt>\(`\/publish\/tasks\/\$\{id\}\/revoke`/, "缺少撤回发布 API 调用"],
];

for (const [path, pattern, message] of backendContracts) {
  requirePattern(path, pattern, message);
}

if (failures.length > 0) {
  console.error("主链路回归检查失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("主链路回归检查通过：GEO、创作、审核、排期、发布、回执、审计和权限链路标记完整。");
