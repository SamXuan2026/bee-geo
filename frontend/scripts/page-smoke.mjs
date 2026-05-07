import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const srcRoot = join(root, "src");
const failures = [];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const stat = statSync(path);
    return stat.isDirectory() ? walk(path) : [path];
  });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function report(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function findTags(source, tagName) {
  const tags = [];
  const pattern = new RegExp(`<${tagName}\\b[\\s\\S]*?>`, "g");
  let match;
  while ((match = pattern.exec(source)) !== null) {
    tags.push(match[0]);
  }
  return tags;
}

const files = walk(srcRoot).filter((file) => /\.(tsx|ts)$/.test(file));
const tsxFiles = files.filter((file) => file.endsWith(".tsx"));
const apiFiles = files.filter((file) => file.endsWith("api.ts"));

for (const file of tsxFiles) {
  const source = read(file);
  const shortPath = relative(root, file);

  for (const button of findTags(source, "button")) {
    const isButton = /type="button"/.test(button);
    const isSubmit = /type="submit"/.test(button);
    const hasClick = /\bonClick=/.test(button);
    const hasForm = /\bform=/.test(button);
    report(!isButton || hasClick, `${shortPath} 存在无点击事件的按钮：${button}`);
    report(!isSubmit || hasForm || hasClick, `${shortPath} 存在无表单归属的提交按钮：${button}`);
  }

  for (const input of [...findTags(source, "input"), ...findTags(source, "select"), ...findTags(source, "textarea")]) {
    const isDisabled = /\bdisabled\b/.test(input);
    const isReadOnly = /\breadOnly\b/.test(input);
    const hasValue = /\bvalue=/.test(input);
    const hasChange = /\bonChange=/.test(input);
    const hasDefault = /\bdefault(Value|Checked)=/.test(input);
    const isCheckbox = /type="checkbox"/.test(input);
    report(isDisabled || isReadOnly || !hasValue || hasChange || isCheckbox || hasDefault, `${shortPath} 存在受控表单但缺少 onChange：${input}`);
  }

  for (const pageHeader of source.matchAll(/<PageHeader[\s\S]*?\/>/g)) {
    const block = pageHeader[0];
    report(!/actionText=/.test(block) || /onAction=/.test(block), `${shortPath} 的 PageHeader 有操作文案但缺少 onAction`);
  }
}

const mutableApis = [
  "features/assets/api.ts",
  "features/creation/api.ts",
  "features/geo/api.ts",
  "features/integration/api.ts",
  "features/keywords/api.ts",
  "features/knowledge/api.ts",
  "features/persona/api.ts",
  "features/publish/api.ts",
  "features/users/api.ts",
];

for (const apiPath of mutableApis) {
  const source = read(join(srcRoot, apiPath));
  report(/readLocalItems|localStorage/.test(source), `${apiPath} 缺少本地兜底读取`);
  report(/writeLocalItems|localStorage\.setItem/.test(source), `${apiPath} 缺少本地兜底写入`);
}

for (const file of apiFiles) {
  const source = read(file);
  const shortPath = relative(root, file);
  const riskyFallback = /withMockFallback\([\s\S]*?,\s*(upsert|delete|record|save|expire|schedule|create)[A-Z]\w*\(/.test(source);
  report(!riskyFallback, `${shortPath} 存在立即执行的兜底副作用，请使用 withMockFallbackFactory`);
}

const requiredFlows = [
  ["app/App.tsx", ["currentRole", "role-switcher", "canAccessModule"]],
  ["features/dashboard/DashboardPage.tsx", ["monitor-console", "gauge-ring", "alarm-board", "trend-board"]],
  ["features/geo/GeoPage.tsx", ["createDraft", "selectedReference", "deleteTarget", "请输入 GEO 分析关键词", "geo-console", "geo-ring", "当前前端模式", "真实接口模式"]],
  ["features/creation/CreationPage.tsx", ["createBlankDraft", "regenerateDraft", "createPublishSchedule", "仅审核通过的内容可以创建发布排期", "creation-console", "creation-ring", "reviewRoles", "publishRoles"]],
  ["features/publish/PublishPage.tsx", ["openReceipts", "retryTask", "openRevokeConfirm", "请填写发布标题和正文", "publish-console", "publish-ring", "publishRoles"]],
  ["features/integration/IntegrationPage.tsx", ["submitCredential", "请输入新的授权凭据"]],
  ["features/audit/AuditPage.tsx", ["listAuditLogPage", "selectedItem", "审计详情"]],
  ["features/permission/PermissionPage.tsx", ["listPermissions", "selectedItem", "权限详情"]],
  ["shared/permissions.ts", ["contentWriteRoles", "reviewRoles", "publishRoles", "superAdminRoles"]],
];

for (const [flowPath, tokens] of requiredFlows) {
  const source = read(join(srcRoot, flowPath));
  for (const token of tokens) {
    report(source.includes(token), `${flowPath} 缺少关键流程标记：${token}`);
  }
}

if (failures.length > 0) {
  console.error("页面冒烟检查失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`页面冒烟检查通过：${tsxFiles.length} 个页面/组件，${apiFiles.length} 个接口文件。`);
