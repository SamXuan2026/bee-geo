import type { ModuleKey, UserRoleCode } from "./types";

export const roleOptions: Array<{ code: UserRoleCode; name: string }> = [
  { code: "SUPER_ADMIN", name: "超级管理员" },
  { code: "CONTENT_ADMIN", name: "内容管理员" },
  { code: "REVIEWER", name: "审核员" },
  { code: "PUBLISHER", name: "发布员" },
  { code: "READONLY_VIEWER", name: "只读观察员" },
];

export const contentWriteRoles: UserRoleCode[] = ["SUPER_ADMIN", "CONTENT_ADMIN"];
export const reviewRoles: UserRoleCode[] = ["SUPER_ADMIN", "REVIEWER"];
export const publishRoles: UserRoleCode[] = ["SUPER_ADMIN", "PUBLISHER"];
export const superAdminRoles: UserRoleCode[] = ["SUPER_ADMIN"];

export function hasAnyRole(currentRole: UserRoleCode, allowedRoles: UserRoleCode[]) {
  return allowedRoles.includes(currentRole);
}

export function roleName(roleCode: UserRoleCode) {
  return roleOptions.find((role) => role.code === roleCode)?.name ?? roleCode;
}

export function permissionTitle(allowedRoles: UserRoleCode[]) {
  return `需要角色：${allowedRoles.map(roleName).join("、")}`;
}

export function canAccessModule(currentRole: UserRoleCode, moduleKey: ModuleKey) {
  if (moduleKey === "users" || moduleKey === "audit" || moduleKey === "permission") {
    return hasAnyRole(currentRole, superAdminRoles);
  }
  return true;
}
