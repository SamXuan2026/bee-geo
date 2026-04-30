import { users } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback } from "../../shared/http";
import type { UserItem } from "./model";

interface UserResponse {
  id: number;
  name: string;
  account: string;
  roleCode: string;
  role: string;
  status: string;
}

export interface UserRoleOption {
  code: string;
  name: string;
}

export interface UserCommand {
  name: string;
  account: string;
  roleCode: string;
  status: string;
}

export function listUsers() {
  return withMockFallback(async (): Promise<UserItem[]> => {
    const data = await apiGet<UserResponse[]>("/users");
    return data.map(mapUser);
  }, users);
}

export function listUserRoles() {
  const fallback: UserRoleOption[] = [
    { code: "SUPER_ADMIN", name: "超级管理员" },
    { code: "CONTENT_ADMIN", name: "内容管理员" },
    { code: "REVIEWER", name: "审核员" },
    { code: "PUBLISHER", name: "发布员" },
    { code: "READONLY_VIEWER", name: "只读观察员" },
  ];
  return withMockFallback(() => apiGet<UserRoleOption[]>("/users/roles"), fallback);
}

export async function createUser(command: UserCommand) {
  return mapUser(await apiPost<UserResponse>("/users", command));
}

export async function updateUser(id: number, command: UserCommand) {
  return mapUser(await apiPut<UserResponse>(`/users/${id}`, command));
}

export async function deleteUser(id: number) {
  return apiDelete<boolean>(`/users/${id}`);
}

function mapUser(item: UserResponse): UserItem {
  return {
    id: item.id,
    name: item.name,
    account: item.account,
    roleCode: item.roleCode,
    role: item.role,
    status: item.status,
    phone: item.account,
    updatedAt: item.status,
  };
}
