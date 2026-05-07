import { creationItems, geoReferences, geoTasks } from "../../shared/mockData";
import { apiGet, apiPost, apiRuntimeMode, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { readLocalItems, upsertLocalItem, writeLocalItems } from "../../shared/localStore";
import type { CreationItem, GeoReference, GeoTask } from "../../shared/types";

const GEO_TASKS_KEY = "bee-geo:fallback-geo-tasks";
const GEO_REFERENCES_KEY = "bee-geo:fallback-geo-references";
const CREATIONS_KEY = "bee-geo:fallback-creations";
let fallbackTasks = readLocalItems<GeoTask>(GEO_TASKS_KEY, geoTasks);
let fallbackReferences = readLocalItems<GeoReference>(GEO_REFERENCES_KEY, geoReferences);

export interface AiProviderStatus {
  providerName: string;
  modelName: string;
  remoteProvider: boolean;
}

export function getGeoRuntimeMode() {
  return apiRuntimeMode();
}

export function getAiProviderStatus() {
  return withMockFallback<AiProviderStatus>(
    () => apiGet<AiProviderStatus>("/ai/provider"),
    {
      providerName: "前端本地兜底",
      modelName: "local-fallback",
      remoteProvider: false,
    }
  );
}

export function listGeoTasks() {
  fallbackTasks = readStoredGeoTasks();
  return withMockFallback<GeoTask[]>(
    async () => {
      const data = await apiGet<GeoTaskResponse[]>("/geo/tasks");
      return data.flatMap(toTaskItems);
    },
    fallbackTasks
  );
}

export function createGeoTask(keyword: string) {
  return withMockFallbackFactory(() => apiPost<GeoTaskResponse>("/geo/tasks", { keyword }), () => createFallbackGeoTask(keyword));
}

export function listGeoReferences(taskId?: number) {
  fallbackReferences = readStoredGeoReferences();
  if (!taskId) {
    return withMockFallback<GeoReference[]>(() => Promise.resolve([]), fallbackReferences);
  }
  return withMockFallback<GeoReference[]>(
    async () => {
      const data = await apiGet<GeoReferenceResponse[]>(`/geo/tasks/${taskId}/results`);
      return data.map(toReference);
    },
    fallbackReferences
  );
}

export function createDraftFromGeo(taskId: number) {
  return withMockFallbackFactory(
    () => apiPost<CreationItemResponse>(`/geo/tasks/${taskId}/create-draft`, {}).then(toCreation),
    () => createFallbackDraft(taskId)
  );
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

function createFallbackGeoTask(keyword: string) {
  const fallbackTask: GeoTaskResponse = {
    id: Date.now(),
    keyword,
    status: "已完成",
    createdAt: new Date().toISOString(),
    questions: [
      `${keyword}如何支撑企业私有化部署？`,
      `${keyword}在权限审计上有哪些选型标准？`,
      `${keyword}怎样提升内容发布闭环效率？`,
    ],
  };
  fallbackTasks = [...toTaskItems(fallbackTask), ...readStoredGeoTasks()];
  fallbackReferences = [
    {
      id: Date.now(),
      keyword,
      question: fallbackTask.questions[0],
      aiTitle: `${keyword}私有化选型建议`,
      url: "https://example.local/articles/local-geo",
      media: "自有站点",
      description: "本地兜底生成的 GEO 引用结果，仅用于后端不可用时演示完整流程。",
    },
    ...readStoredGeoReferences(),
  ];
  writeLocalItems(GEO_TASKS_KEY, fallbackTasks);
  writeLocalItems(GEO_REFERENCES_KEY, fallbackReferences);
  recordLocalAudit("GEO 分析", "创建分析任务", String(fallbackTask.id), true, "/api/geo/tasks");
  return fallbackTask;
}

function createFallbackDraft(taskId: number) {
  const task = readStoredGeoTasks().find((item) => (item.taskId ?? item.id) === taskId);
  const fallbackDraft: CreationItemResponse = {
    id: Date.now(),
    geoTaskId: taskId,
    title: `${task?.keyword ?? "GEO"}内容选题草稿`,
    brand: "BeeWorks",
    platform: "自有站点",
    summary: "基于 GEO 引用结果生成的本地创作草稿。",
    body: "请结合企业私有化、权限审计和内容发布闭环继续完善正文。",
    publishAt: undefined,
    status: "DRAFT",
  };
  const creation = toCreation(fallbackDraft);
  const creations = upsertLocalItem(readLocalItems<CreationItem>(CREATIONS_KEY, creationItems), creation);
  writeLocalItems(CREATIONS_KEY, creations);
  recordLocalAudit("GEO 分析", "生成创作草稿", String(taskId), true, `/api/geo/tasks/${taskId}/create-draft`);
  return creation;
}

function readStoredGeoTasks() {
  return readLocalItems<GeoTask>(GEO_TASKS_KEY, fallbackTasks);
}

function readStoredGeoReferences() {
  return readLocalItems<GeoReference>(GEO_REFERENCES_KEY, fallbackReferences);
}
