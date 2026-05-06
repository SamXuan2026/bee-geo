import { publishTasks } from "../../shared/mockData";
import { apiGet, apiPost, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { readLocalItems, writeLocalItems } from "../../shared/localStore";
import type { ContentStatus, PublishAccount, PublishReceipt, PublishTask } from "../../shared/types";

export interface PublishTaskQuery {
  keyword?: string;
  platformCode?: string;
  status?: ContentStatus | "";
}

export interface PublishTaskPayload {
  contentId?: number;
  title: string;
  body: string;
  platformCode: string;
  accountId: string;
  scheduledAt?: string;
  maxRetryCount?: number;
}

export interface PublishActionReceipt {
  success: boolean;
  externalPublishId?: string;
  url?: string;
  message: string;
  publishedAt?: string;
}

const FALLBACK_TASKS_KEY = "bee-geo:fallback-publish-tasks";
const FALLBACK_RECEIPTS_KEY = "bee-geo:fallback-publish-receipts";

const fallbackAccounts: PublishAccount[] = [
  {
    id: 1,
    accountId: "site-main",
    name: "官网主站",
    platformCode: "OWNED_SITE",
    platformName: "自有站点",
    endpoint: "https://www.beegeo.local",
    status: "VALID",
    expiresAt: "2026-12-31",
  },
  {
    id: 2,
    accountId: "csdn",
    name: "CSDN",
    platformCode: "FREE_MEDIA",
    platformName: "免费媒体",
    endpoint: "Cookie 已脱敏",
    status: "NEED_REAUTH",
    expiresAt: "2026-04-29",
  },
  {
    id: 3,
    accountId: "cnblogs",
    name: "博客园",
    platformCode: "FREE_MEDIA",
    platformName: "免费媒体",
    endpoint: "Cookie 已脱敏",
    status: "VALID",
    expiresAt: "2026-05-20",
  },
];
let fallbackTasks = readLocalItems<PublishTask>(FALLBACK_TASKS_KEY, publishTasks);
let fallbackReceipts = readLocalItems<PublishReceipt>(FALLBACK_RECEIPTS_KEY, []);

export function listPublishTasks(query: PublishTaskQuery = {}) {
  fallbackTasks = readLocalItems<PublishTask>(FALLBACK_TASKS_KEY, fallbackTasks);
  const search = new URLSearchParams();
  if (query.keyword) {
    search.set("keyword", query.keyword);
  }
  if (query.platformCode) {
    search.set("platformCode", query.platformCode);
  }
  if (query.status) {
    search.set("status", query.status);
  }
  const queryString = search.toString();
  const path = queryString ? `/publish/tasks?${queryString}` : "/publish/tasks";
  return withMockFallback<PublishTask[]>(() => apiGet<PublishTask[]>(path), filterFallbackTasks(query));
}

export function listPublishAccounts() {
  return withMockFallback<PublishAccount[]>(() => apiGet<PublishAccount[]>("/publish/tasks/accounts"), fallbackAccounts);
}

export function createPublishTask(payload: PublishTaskPayload) {
  const account = fallbackAccounts.find((item) => item.accountId === payload.accountId);
  const fallbackTask: PublishTask = {
    id: Date.now(),
    contentId: payload.contentId,
    title: payload.title,
    platform: account?.platformName ?? payload.platformCode,
    platformCode: payload.platformCode,
    account: account?.name ?? payload.accountId,
    accountId: payload.accountId,
    scheduledAt: payload.scheduledAt ?? new Date().toISOString(),
    status: "SCHEDULED",
    retryCount: 0,
    maxRetryCount: payload.maxRetryCount ?? 3,
    receipt: "等待发布",
  };
  return withMockFallbackFactory(async () => apiPost<PublishTask>("/publish/tasks", payload), () => appendFallbackTask(fallbackTask));
}

export function retryPublishTask(id: number) {
  return withMockFallbackFactory(
    () => apiPost<PublishActionReceipt>(`/publish/tasks/${id}/retry`, {}),
    () => recordFallbackReceipt(id, true, "本地模拟重试成功")
  );
}

export function revokePublishTask(id: number) {
  return withMockFallbackFactory(
    () => apiPost<PublishActionReceipt>(`/publish/tasks/${id}/revoke`, {}),
    () => recordFallbackReceipt(id, true, "本地模拟撤回成功")
  );
}

export function listPublishReceipts(id: number) {
  fallbackReceipts = readLocalItems<PublishReceipt>(FALLBACK_RECEIPTS_KEY, fallbackReceipts);
  return withMockFallback<PublishReceipt[]>(() => apiGet<PublishReceipt[]>(`/publish/tasks/${id}/receipts`), fallbackReceipts.filter((item) => item.taskId === id));
}

function filterFallbackTasks(query: PublishTaskQuery) {
  const normalizedKeyword = query.keyword?.trim().toLowerCase();
  return fallbackTasks.filter((item) => {
    const matchesKeyword =
      !normalizedKeyword ||
      item.title.toLowerCase().includes(normalizedKeyword) ||
      item.platform.toLowerCase().includes(normalizedKeyword) ||
      item.account.toLowerCase().includes(normalizedKeyword);
    const matchesPlatform = !query.platformCode || item.platformCode === query.platformCode;
    const matchesStatus = !query.status || item.status === query.status;
    return matchesKeyword && matchesPlatform && matchesStatus;
  });
}

function appendFallbackTask(task: PublishTask) {
  fallbackTasks = [task, ...readLocalItems<PublishTask>(FALLBACK_TASKS_KEY, fallbackTasks)];
  writeLocalItems(FALLBACK_TASKS_KEY, fallbackTasks);
  recordLocalAudit("发布中心", "创建发布任务", String(task.id), true, "/api/publish/tasks");
  return task;
}

function recordFallbackReceipt(id: number, success: boolean, message: string): PublishActionReceipt {
  fallbackTasks = readLocalItems<PublishTask>(FALLBACK_TASKS_KEY, fallbackTasks);
  fallbackReceipts = readLocalItems<PublishReceipt>(FALLBACK_RECEIPTS_KEY, fallbackReceipts);
  const task = fallbackTasks.find((item) => item.id === id);
  const nextAttemptNo = (task?.retryCount ?? 0) + 1;
  if (task) {
    task.retryCount = nextAttemptNo;
    task.status = message.includes("撤回") ? "REVOKED" : success ? "PUBLISHED" : "FAILED";
    task.receipt = message;
    task.url = success && !message.includes("撤回") ? `https://example.local/published/${id}` : task.url;
  }
  const receipt: PublishReceipt = {
    id: Date.now(),
    taskId: id,
    platformCode: task?.platformCode ?? "OWNED_SITE",
    accountId: task?.accountId ?? "site-main",
    attemptNo: nextAttemptNo,
    success,
    url: task?.url,
    message,
    createdAt: new Date().toISOString(),
    publishedAt: success ? new Date().toISOString() : undefined,
  };
  fallbackReceipts = [receipt, ...fallbackReceipts];
  writeLocalItems(FALLBACK_TASKS_KEY, fallbackTasks);
  writeLocalItems(FALLBACK_RECEIPTS_KEY, fallbackReceipts);
  recordLocalAudit("发布中心", message.includes("撤回") ? "撤回发布任务" : "重试发布任务", String(id), success, `/api/publish/tasks/${id}`);
  return {
    success,
    url: receipt.url,
    message,
    publishedAt: receipt.publishedAt,
  };
}
