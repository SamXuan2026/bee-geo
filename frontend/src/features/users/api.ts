import { users } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { formatLocalDateTime, readLocalItems, upsertLocalItem, writeLocalItems } from "../../shared/localStore";
import type { UserItem } from "./model";

const USERS_KEY = "bee-geo:fallback-users";
let fallbackUsers = readLocalItems<UserItem>(USERS_KEY, users);

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
  fallbackUsers = readStoredUsers();
  return withMockFallback(async (): Promise<UserItem[]> => {
    const data = await apiGet<UserResponse[]>("/users");
    return data.map(mapUser);
  }, fallbackUsers);
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
  return withMockFallbackFactory(
    async () => mapUser(await apiPost<UserResponse>("/users", command)),
    () => upsertFallbackUser(command)
  );
}

export async function updateUser(id: number, command: UserCommand) {
  return withMockFallbackFactory(
    async () => mapUser(await apiPut<UserResponse>(`/users/${id}`, command)),
    () => upsertFallbackUser(command, id)
  );
}

export async function deleteUser(id: number) {
  return withMockFallbackFactory(async () => apiDelete<boolean>(`/users/${id}`), () => deleteFallbackUser(id));
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

function upsertFallbackUser(command: UserCommand, id = Date.now()): UserItem {
  const role = roleName(command.roleCode);
  const item: UserItem = {
    id,
    name: command.name,
    account: command.account,
    roleCode: command.roleCode,
    role,
    status: command.status,
    phone: command.account,
    updatedAt: formatLocalDateTime(),
  };
  fallbackUsers = upsertLocalItem(readStoredUsers(), item);
  writeLocalItems(USERS_KEY, fallbackUsers);
  recordLocalAudit("用户管理", "保存用户", String(id), true, `/api/users/${id}`);
  return item;
}

function deleteFallbackUser(id: number) {
  fallbackUsers = readStoredUsers().filter((user) => user.id !== id);
  writeLocalItems(USERS_KEY, fallbackUsers);
  recordLocalAudit("用户管理", "删除用户", String(id), true, `/api/users/${id}`);
  return true;
}

function roleName(roleCode: string) {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: "超级管理员",
    CONTENT_ADMIN: "内容管理员",
    REVIEWER: "审核员",
    PUBLISHER: "发布员",
    READONLY_VIEWER: "只读观察员",
  };
  return roleMap[roleCode] ?? roleCode;
}

function readStoredUsers() {
  return readLocalItems<UserItem>(USERS_KEY, fallbackUsers);
}
