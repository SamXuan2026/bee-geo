import { publishTasks } from "../../shared/mockData";
import { apiGet, apiPost, withMockFallback } from "../../shared/http";
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

export function listPublishTasks(query: PublishTaskQuery = {}) {
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
  return withMockFallback<PublishTask[]>(() => apiGet<PublishTask[]>(path), publishTasks);
}

export function listPublishAccounts() {
  return withMockFallback<PublishAccount[]>(() => apiGet<PublishAccount[]>("/publish/tasks/accounts"), fallbackAccounts);
}

export function createPublishTask(payload: PublishTaskPayload) {
  return apiPost<PublishTask>("/publish/tasks", payload);
}

export function retryPublishTask(id: number) {
  return apiPost<PublishActionReceipt>(`/publish/tasks/${id}/retry`, {});
}

export function revokePublishTask(id: number) {
  return apiPost<PublishActionReceipt>(`/publish/tasks/${id}/revoke`, {});
}

export function listPublishReceipts(id: number) {
  return withMockFallback<PublishReceipt[]>(() => apiGet<PublishReceipt[]>(`/publish/tasks/${id}/receipts`), []);
}
