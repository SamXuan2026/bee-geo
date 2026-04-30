import { creationItems } from "../../shared/mockData";
import { apiGet, apiPost, apiPut, withMockFallback } from "../../shared/http";
import type { CreationItem, PublishTask } from "../../shared/types";

export function listCreations() {
  return withMockFallback<CreationItem[]>(
    async () => {
      const data = await apiGet<CreationResponse[]>("/creations");
      return data.map(toItem);
    },
    creationItems
  );
}

export function submitCreationReview(id: number) {
  return apiPost<CreationResponse>(`/creations/${id}/submit-review`, {}).then(toItem);
}

export function approveCreation(id: number) {
  return apiPost<CreationResponse>(`/creations/${id}/approve`, {}).then(toItem);
}

export function updateCreation(id: number, payload: CreationUpdatePayload) {
  return apiPut<CreationResponse>(`/creations/${id}`, payload).then(toItem);
}

export function scheduleCreationPublish(id: number, payload: CreationPublishPayload) {
  return apiPost<PublishTask>(`/creations/${id}/schedule-publish`, payload);
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
