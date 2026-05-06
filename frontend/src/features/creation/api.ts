import { creationItems, publishTasks } from "../../shared/mockData";
import { apiGet, apiPost, apiPut, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { readLocalItems, upsertLocalItem, writeLocalItems } from "../../shared/localStore";
import type { CreationItem, PublishTask } from "../../shared/types";

const CREATIONS_KEY = "bee-geo:fallback-creations";
const FALLBACK_TASKS_KEY = "bee-geo:fallback-publish-tasks";
let fallbackCreations = readLocalItems<CreationItem>(CREATIONS_KEY, creationItems);

export function listCreations() {
  fallbackCreations = readStoredCreations();
  return withMockFallback<CreationItem[]>(
    async () => {
      const data = await apiGet<CreationResponse[]>("/creations");
      return data.map(toItem);
    },
    fallbackCreations
  );
}

export function submitCreationReview(id: number) {
  return withMockFallbackFactory(
    () => apiPost<CreationResponse>(`/creations/${id}/submit-review`, {}).then(toItem),
    () => updateFallbackStatus(id, "PENDING_REVIEW")
  );
}

export function approveCreation(id: number) {
  return withMockFallbackFactory(
    () => apiPost<CreationResponse>(`/creations/${id}/approve`, {}).then(toItem),
    () => updateFallbackStatus(id, "APPROVED")
  );
}

export function updateCreation(id: number, payload: CreationUpdatePayload) {
  return withMockFallbackFactory(
    () => apiPut<CreationResponse>(`/creations/${id}`, payload).then(toItem),
    () => updateFallbackCreation(id, payload)
  );
}

export function scheduleCreationPublish(id: number, payload: CreationPublishPayload) {
  return withMockFallbackFactory(
    () => apiPost<PublishTask>(`/creations/${id}/schedule-publish`, payload),
    () => scheduleFallbackCreation(id, payload)
  );
}

export interface CreationUpdatePayload {
  title: string;
  brand: string;
  platform: string;
  summary?: string;
  body: string;
}

export interface CreationPublishPayload {
  platformCode: string;
  accountId: string;
  scheduledAt?: string;
  maxRetryCount?: number;
}

interface CreationResponse {
  id: number;
  geoTaskId?: number;
  title: string;
  brand: string;
  platform: string;
  summary?: string;
  body?: string;
  publishAt?: string;
  status: CreationItem["status"];
}

function toItem(response: CreationResponse): CreationItem {
  return {
    id: response.id,
    geoTaskId: response.geoTaskId,
    title: response.title,
    brand: response.brand,
    platform: response.platform,
    summary: response.summary,
    body: response.body,
    publishAt: response.publishAt ? response.publishAt.replace("T", " ").slice(0, 16) : "未设置",
    status: response.status,
  };
}

function updateFallbackStatus(id: number, status: CreationItem["status"]) {
  const item = readStoredCreations().find((creation) => creation.id === id);
  if (!item) {
    return fallbackCreations[0] ?? {
      id,
      title: "本地创作内容",
      brand: "BeeWorks",
      platform: "自有站点",
      publishAt: "未设置",
      status,
    };
  }
  const nextItem = { ...item, status };
  fallbackCreations = upsertLocalItem(readStoredCreations(), nextItem);
  writeLocalItems(CREATIONS_KEY, fallbackCreations);
  recordLocalAudit("AI 创作", status === "APPROVED" ? "审核通过" : "提交审核", String(id), true, `/api/creations/${id}`);
  return nextItem;
}

function updateFallbackCreation(id: number, payload: CreationUpdatePayload) {
  const current = readStoredCreations().find((creation) => creation.id === id);
  const nextItem: CreationItem = {
    id,
    title: payload.title,
    brand: payload.brand,
    platform: payload.platform,
    summary: payload.summary,
    body: payload.body,
    publishAt: current?.publishAt ?? "未设置",
    status: current?.status ?? "DRAFT",
  };
  fallbackCreations = upsertLocalItem(readStoredCreations(), nextItem);
  writeLocalItems(CREATIONS_KEY, fallbackCreations);
  recordLocalAudit("AI 创作", "保存草稿", String(id), true, `/api/creations/${id}`);
  return nextItem;
}

function scheduleFallbackCreation(id: number, payload: CreationPublishPayload): PublishTask {
  const item = readStoredCreations().find((creation) => creation.id === id);
  if (item) {
    item.status = "SCHEDULED";
    item.publishAt = payload.scheduledAt?.replace("T", " ").slice(0, 16) ?? "未设置";
    fallbackCreations = upsertLocalItem(readStoredCreations(), item);
    writeLocalItems(CREATIONS_KEY, fallbackCreations);
  }
  const task: PublishTask = {
    id: Date.now(),
    contentId: id,
    title: item?.title ?? "本地创作内容",
    platform: payload.platformCode === "FREE_MEDIA" ? "免费媒体" : "自有站点",
    platformCode: payload.platformCode,
    account: payload.accountId,
    accountId: payload.accountId,
    scheduledAt: payload.scheduledAt ?? new Date().toISOString(),
    status: "SCHEDULED",
    retryCount: 0,
    maxRetryCount: payload.maxRetryCount ?? 3,
    receipt: "等待发布",
  };
  appendStoredPublishTask(task);
  recordLocalAudit("AI 创作", "创建发布排期", String(id), true, `/api/creations/${id}/schedule-publish`);
  return task;
}

function appendStoredPublishTask(task: PublishTask) {
  if (typeof window === "undefined") {
    return;
  }
  const raw = window.localStorage.getItem(FALLBACK_TASKS_KEY);
  let current: PublishTask[] = [];
  try {
    current = raw ? JSON.parse(raw) as PublishTask[] : publishTasks;
  } catch {
    current = publishTasks;
  }
  window.localStorage.setItem(FALLBACK_TASKS_KEY, JSON.stringify([task, ...current]));
}

function readStoredCreations() {
  return readLocalItems<CreationItem>(CREATIONS_KEY, fallbackCreations);
}
