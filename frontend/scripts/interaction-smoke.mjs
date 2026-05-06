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

function requireTokens(path, tokens, scopeName = path) {
  const source = read(path);
  for (const token of tokens) {
    report(source.includes(token), `${scopeName} 缺少交互绑定：${token}`);
  }
}

function findFunctionBody(source, functionName) {
  const pattern = new RegExp(`(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`, "m");
  const match = pattern.exec(source);
  if (!match) {
    return "";
  }
  let depth = 0;
  let start = match.index + match[0].length - 1;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") {
      depth += 1;
    }
    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start + 1, index);
      }
    }
  }
  return "";
}

function requireHandler(path, functionName, tokens) {
  const source = read(path);
  const body = findFunctionBody(source, functionName);
  report(Boolean(body), `${path} 缺少交互处理函数：${functionName}`);
  for (const token of tokens) {
    report(body.includes(token), `${path} 的 ${functionName} 缺少关键动作：${token}`);
  }
}

function requireCrudPage(contract) {
  requireTokens(contract.path, [
    "onAction={openCreate}",
    "onClick={() => openEdit(item)}",
    "onClick={() => setDeleteItem(item)}",
    `form="${contract.formId}"`,
  ], contract.name);
  requireHandler(contract.path, "openCreate", ["setNotice", "setEditingItem(null)", "setForm"]);
  requireHandler(contract.path, "openEdit", ["setEditingItem(item)", "setForm"]);
  requireHandler(contract.path, "submitForm", [contract.createApi, contract.updateApi, "setNotice", contract.reloadToken]);
  requireHandler(contract.path, "confirmDelete", [contract.deleteApi, "setDeleteItem(null)", "setNotice", contract.reloadToken]);
}

requireTokens("app/App.tsx", [
  "onClick={() => setActiveModule(item.key)}",
  "disabled={!canAccessModule(currentRole, item.key)}",
  "setCurrentRole(event.target.value as UserRoleCode)",
  "setNotice(`当前演示角色已切换为${roleName(event.target.value as UserRoleCode)}`)",
  "onClick={() => setActiveModule(\"publish\")}",
], "应用导航");

requireTokens("shared/ui.tsx", [
  "type PageHeaderProps = PageHeaderBaseProps & (",
  "actionText: string;",
  "onAction: () => void;",
  "onClick={props.onAction}",
], "通用页头");

requireTokens("features/geo/GeoPage.tsx", [
  "actionText=\"创建分析任务\"",
  "onAction={submitTask}",
  "onClick={createDraft}",
  "onClick={() => openTask(task)}",
  "onClick={() => setDeleteTarget(task)}",
  "onClick={() => setSelectedReference(item)}",
], "GEO 页面按钮");
requireHandler("features/geo/GeoPage.tsx", "submitTask", ["createGeoTask", "reload()", "setReferences", "setNotice"]);
requireHandler("features/geo/GeoPage.tsx", "openTask", ["setSelectedTask(task)", "listGeoReferences"]);
requireHandler("features/geo/GeoPage.tsx", "confirmDeleteTask", ["setTasks", "setDeleteTarget(null)", "setNotice"]);
requireHandler("features/geo/GeoPage.tsx", "createDraft", ["createDraftFromGeo", "setNotice", "onCreateDraft()"]);

requireTokens("features/creation/CreationPage.tsx", [
  "actionText=\"添加新的创作\"",
  "onAction={createBlankDraft}",
  "onClick={regenerateDraft}",
  "onClick={saveDraft}",
  "onClick={() => editing ? createPublishSchedule(editing) : undefined}",
  "onClick={() => setEditing(item)}",
  "onClick={() => submitReview(item.id)}",
  "onClick={() => approve(item.id)}",
  "onClick={() => createPublishSchedule(item)}",
], "创作页面按钮");
requireHandler("features/creation/CreationPage.tsx", "createBlankDraft", ["setItems", "setEditing", "setNotice"]);
requireHandler("features/creation/CreationPage.tsx", "regenerateDraft", ["setEditing", "setNotice"]);
requireHandler("features/creation/CreationPage.tsx", "saveDraft", ["updateCreation", "setEditing", "reload()"]);
requireHandler("features/creation/CreationPage.tsx", "submitReview", ["submitCreationReview", "setNotice", "reload()"]);
requireHandler("features/creation/CreationPage.tsx", "approve", ["approveCreation", "setNotice", "reload()"]);
requireHandler("features/creation/CreationPage.tsx", "createPublishSchedule", ["scheduleCreationPublish", "setNotice", "onOpenPublish()"]);

requireTokens("features/publish/PublishPage.tsx", [
  "actionText=\"创建发布任务\"",
  "onAction={openCreate}",
  "onClick={submitTask}",
  "onClick={() => openReceipts(item)}",
  "onClick={() => retryTask(item)}",
  "onClick={() => openRevokeConfirm(item)}",
  "onConfirm={confirmRevoke}",
], "发布页面按钮");
requireHandler("features/publish/PublishPage.tsx", "openCreate", ["setForm", "nextLocalDateTime"]);
requireHandler("features/publish/PublishPage.tsx", "submitTask", ["createPublishTask", "setForm(null)", "reloadTasks()"]);
requireHandler("features/publish/PublishPage.tsx", "retryTask", ["retryPublishTask", "setNotice", "reloadTasks()"]);
requireHandler("features/publish/PublishPage.tsx", "confirmRevoke", ["revokePublishTask", "setRevokeTarget(null)", "reloadTasks()"]);
requireHandler("features/publish/PublishPage.tsx", "openReceipts", ["setSelectedTask(task)", "listPublishReceipts"]);
requireHandler("features/publish/PublishPage.tsx", "openRevokeConfirm", ["setRevokeTarget(task)"]);

requireTokens("features/integration/IntegrationPage.tsx", [
  "onClick={() => openAuth(item)}",
  "onClick={() => setExpireTarget(item)}",
  "onClick={submitCredential}",
  "onConfirm={confirmExpire}",
], "集成页面按钮");
requireHandler("features/integration/IntegrationPage.tsx", "openAuth", ["setAuthTarget(item)", "setSecretValue(\"\")"]);
requireHandler("features/integration/IntegrationPage.tsx", "submitCredential", ["saveIntegrationCredential", "setAuthTarget(null)", "reload()"]);
requireHandler("features/integration/IntegrationPage.tsx", "confirmExpire", ["expireIntegrationCredential", "setExpireTarget(null)", "reload()"]);

requireTokens("features/audit/AuditPage.tsx", [
  "onClick={exportCurrentLogs}",
  "onClick={() => setSelectedItem(item)}",
  "onClick={() => setPage(1)}",
  "onClick={() => setPage((current) => Math.max(current - 1, 1))}",
  "onClick={() => setPage((current) => Math.min(current + 1, totalPages))}",
  "onClick={() => setPage(totalPages)}",
  "onClick={() => setExportResult(null)}",
], "审计页面按钮");
requireHandler("features/audit/AuditPage.tsx", "exportCurrentLogs", ["exportAuditLogs", "setExportResult", "setError"]);
requireHandler("features/audit/AuditPage.tsx", "updateKeyword", ["setKeyword", "setPage(1)"]);
requireHandler("features/audit/AuditPage.tsx", "updatePageSize", ["setPageSize", "setPage(1)"]);

requireTokens("features/permission/PermissionPage.tsx", [
  "onClick={() => setSelectedItem(item)}",
  "onClick={() => setSelectedItem(null)}",
  "listPermissionRoles().then(setRoles)",
  "listPermissions({ keyword, roleCode, riskLevel })",
], "权限页面按钮");

[
  {
    name: "关键词页面",
    path: "features/keywords/KeywordsPage.tsx",
    formId: "keyword-form",
    createApi: "createKeyword",
    updateApi: "updateKeyword",
    deleteApi: "deleteKeyword",
    reloadToken: "refresh()",
  },
  {
    name: "知识库页面",
    path: "features/knowledge/KnowledgePage.tsx",
    formId: "knowledge-form",
    createApi: "createKnowledge",
    updateApi: "updateKnowledge",
    deleteApi: "deleteKnowledge",
    reloadToken: "refresh()",
  },
  {
    name: "素材页面",
    path: "features/assets/AssetsPage.tsx",
    formId: "asset-form",
    createApi: "createAsset",
    updateApi: "updateAsset",
    deleteApi: "deleteAsset",
    reloadToken: "refresh()",
  },
  {
    name: "人设页面",
    path: "features/persona/PersonaPage.tsx",
    formId: "persona-form",
    createApi: "createPersona",
    updateApi: "updatePersona",
    deleteApi: "deletePersona",
    reloadToken: "refresh()",
  },
  {
    name: "用户页面",
    path: "features/users/UsersPage.tsx",
    formId: "user-form",
    createApi: "createUser",
    updateApi: "updateUser",
    deleteApi: "deleteUser",
    reloadToken: "refresh()",
  },
].forEach(requireCrudPage);

requireHandler("features/persona/PersonaPage.tsx", "generatePersona", ["setBuilderResult", "setForm", "setNotice"]);

if (failures.length > 0) {
  console.error("交互契约检查失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("交互契约检查通过：核心按钮、弹窗、表单、分页、审计导出、授权和发布链路均有明确动作绑定。");
