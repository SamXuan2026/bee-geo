import { apiGet, withMockFallback } from "../../shared/http";
import type { PermissionMatrixItem } from "./model";

export interface PermissionQuery {
  keyword?: string;
  roleCode?: string;
  riskLevel?: PermissionMatrixItem["riskLevel"] | "";
}

const fallbackPermissions: PermissionMatrixItem[] = [
  {
    id: 1,
    module: "用户管理",
    permission: "USER_MANAGE",
    description: "新增、编辑、删除用户和分配角色。",
    riskLevel: "高",
    roles: ["SUPER_ADMIN"],
    backendGuarded: true,
  },
  {
    id: 2,
    module: "审计日志",
    permission: "AUDIT_READ",
    description: "查看系统关键操作审计记录。",
    riskLevel: "高",
    roles: ["SUPER_ADMIN"],
    backendGuarded: true,
  },
  {
    id: 3,
    module: "集成设置",
    permission: "CREDENTIAL_MANAGE",
    description: "更新发布账号 Token、Cookie 等敏感凭据。",
    riskLevel: "高",
    roles: ["SUPER_ADMIN", "PUBLISHER"],
    backendGuarded: true,
  },
  {
    id: 4,
    module: "AI 创作",
    permission: "CONTENT_REVIEW",
    description: "提交审核、审核通过、驳回创作内容。",
    riskLevel: "中",
    roles: ["SUPER_ADMIN", "CONTENT_ADMIN", "REVIEWER"],
    backendGuarded: true,
  },
  {
    id: 5,
    module: "发布中心",
    permission: "PUBLISH_EXECUTE",
    description: "创建发布排期、执行重试、撤回任务。",
    riskLevel: "高",
    roles: ["SUPER_ADMIN", "PUBLISHER"],
    backendGuarded: true,
  },
  {
    id: 6,
    module: "GEO 分析",
    permission: "GEO_WRITE",
    description: "创建分析任务并生成创作草稿。",
    riskLevel: "中",
    roles: ["SUPER_ADMIN", "CONTENT_ADMIN"],
    backendGuarded: true,
  },
  {
    id: 7,
    module: "资产管理",
    permission: "ASSET_WRITE",
    description: "维护关键词、知识库、素材和 AI 人设。",
    riskLevel: "中",
    roles: ["SUPER_ADMIN", "CONTENT_ADMIN"],
    backendGuarded: true,
  },
  {
    id: 8,
    module: "总览",
    permission: "DASHBOARD_READ",
    description: "查看仪表盘、待办和发布状态。",
    riskLevel: "低",
    roles: ["SUPER_ADMIN", "CONTENT_ADMIN", "REVIEWER", "PUBLISHER", "READONLY_VIEWER"],
    backendGuarded: false,
  },
];

export function listPermissions(query: PermissionQuery = {}) {
  const search = new URLSearchParams();
  if (query.keyword?.trim()) {
    search.set("keyword", query.keyword.trim());
  }
  if (query.roleCode) {
    search.set("roleCode", query.roleCode);
  }
  if (query.riskLevel) {
    search.set("riskLevel", query.riskLevel);
  }
  const path = search.toString() ? `/security/permissions?${search.toString()}` : "/security/permissions";
  return withMockFallback(
    async () => apiGet<PermissionMatrixItem[]>(path),
    filterPermissions(query)
  );
}

export function listPermissionRoles() {
  return withMockFallback(
    async () => apiGet<Array<{ code: string; name: string }>>("/users/roles"),
    [
      { code: "SUPER_ADMIN", name: "超级管理员" },
      { code: "CONTENT_ADMIN", name: "内容管理员" },
      { code: "REVIEWER", name: "审核员" },
      { code: "PUBLISHER", name: "发布员" },
      { code: "READONLY_VIEWER", name: "只读观察员" },
    ]
  );
}

function filterPermissions(query: PermissionQuery) {
  const keyword = query.keyword?.trim().toLowerCase();
  return fallbackPermissions.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.module.toLowerCase().includes(keyword) ||
      item.permission.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword);
    const matchesRole = !query.roleCode || item.roles.includes(query.roleCode);
    const matchesRisk = !query.riskLevel || item.riskLevel === query.riskLevel;
    return matchesKeyword && matchesRole && matchesRisk;
  });
}
