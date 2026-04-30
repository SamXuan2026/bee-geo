import { geoReferences, geoTasks } from "../../shared/mockData";
import { apiGet, apiPost, withMockFallback } from "../../shared/http";
import type { CreationItem, GeoReference, GeoTask } from "../../shared/types";

export function listGeoTasks() {
  return withMockFallback<GeoTask[]>(
    async () => {
      const data = await apiGet<GeoTaskResponse[]>("/geo/tasks");
      return data.flatMap(toTaskItems);
    },
    geoTasks
  );
}

export function createGeoTask(keyword: string) {
  return apiPost<GeoTaskResponse>("/geo/tasks", { keyword });
}

export function listGeoReferences(taskId?: number) {
  if (!taskId) {
    return withMockFallback<GeoReference[]>(() => apiGet<GeoReference[]>("/geo/tasks/1/results"), geoReferences);
  }
  return withMockFallback<GeoReference[]>(
    async () => {
      const data = await apiGet<GeoReferenceResponse[]>(`/geo/tasks/${taskId}/results`);
      return data.map(toReference);
    },
    geoReferences
  );
}

export function createDraftFromGeo(taskId: number) {
  return apiPost<CreationItemResponse>(`/geo/tasks/${taskId}/create-draft`, {}).then(toCreation);
}

interface GeoTaskResponse {
  id: number;
  keyword: string;
  status: GeoTask["status"];
  createdAt: string;
  questions: string[];
}

interface GeoReferenceResponse {
  id: number;
  taskId: number;
  keyword: string;
  question: string;
  aiTitle: string;
  url: string;
  media: string;
  description: string;
}

interface CreationItemResponse {
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

function toTaskItems(response: GeoTaskResponse): GeoTask[] {
  if (response.questions.length === 0) {
    return [{
      id: response.id,
      taskId: response.id,
      keyword: response.keyword,
      question: response.keyword,
      status: response.status,
      createdAt: formatDateTime(response.createdAt),
      questions: response.questions,
    }];
  }
  return response.questions.map((question, index) => ({
    id: Number(`${response.id}${index + 1}`),
    taskId: response.id,
    keyword: response.keyword,
    question,
    status: response.status,
    createdAt: formatDateTime(response.createdAt),
    questions: response.questions,
  }));
}

function toReference(response: GeoReferenceResponse): GeoReference {
  return {
    id: response.id,
    keyword: response.keyword,
    question: response.question,
    aiTitle: response.aiTitle,
    url: response.url,
    media: response.media,
    description: response.description,
  };
}

function toCreation(response: CreationItemResponse): CreationItem {
  return {
    id: response.id,
    geoTaskId: response.geoTaskId,
    title: response.title,
    brand: response.brand,
    platform: response.platform,
    summary: response.summary,
    body: response.body,
    publishAt: response.publishAt ? formatDateTime(response.publishAt) : "未设置",
    status: response.status,
  };
}

function formatDateTime(value: string) {
  return value.replace("T", " ").slice(0, 16);
}
