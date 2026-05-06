import { knowledgeItems } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { formatLocalDateTime, readLocalItems, upsertLocalItem, writeLocalItems } from "../../shared/localStore";
import type { KnowledgeItem } from "./model";

const KNOWLEDGE_KEY = "bee-geo:fallback-knowledge";
let fallbackKnowledgeItems = readLocalItems<KnowledgeItem>(KNOWLEDGE_KEY, knowledgeItems);

interface KnowledgeResponse {
  id: number;
  name: string;
  type: string;
  groupName: string;
  content?: string;
  enabled?: boolean;
  updatedAt: string;
}

export interface KnowledgeCommand {
  name: string;
  type: string;
  groupName: string;
  content?: string;
  enabled: boolean;
}

export function listKnowledgeItems() {
  fallbackKnowledgeItems = readStoredKnowledge();
  return withMockFallback(async (): Promise<KnowledgeItem[]> => {
    const data = await apiGet<KnowledgeResponse[]>("/knowledge");
    return data.map(mapKnowledge);
  }, fallbackKnowledgeItems);
}

export async function createKnowledgeItem(command: KnowledgeCommand) {
  return withMockFallbackFactory(
    async () => mapKnowledge(await apiPost<KnowledgeResponse>("/knowledge", command)),
    () => upsertFallbackKnowledge(command)
  );
}

export async function updateKnowledgeItem(id: number, command: KnowledgeCommand) {
  return withMockFallbackFactory(
    async () => mapKnowledge(await apiPut<KnowledgeResponse>(`/knowledge/${id}`, command)),
    () => upsertFallbackKnowledge(command, id)
  );
}

export async function deleteKnowledgeItem(id: number) {
  return withMockFallbackFactory(async () => apiDelete<boolean>(`/knowledge/${id}`), () => deleteFallbackKnowledge(id));
}

function mapKnowledge(item: KnowledgeResponse): KnowledgeItem {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    group: item.groupName,
    content: item.content,
    enabled: item.enabled,
    updatedAt: item.updatedAt,
  };
}

function upsertFallbackKnowledge(command: KnowledgeCommand, id = Date.now()): KnowledgeItem {
  const item: KnowledgeItem = {
    id,
    name: command.name,
    type: command.type,
    group: command.groupName,
    content: command.content,
    enabled: command.enabled,
    updatedAt: formatLocalDateTime(),
  };
  fallbackKnowledgeItems = upsertLocalItem(readStoredKnowledge(), item);
  writeLocalItems(KNOWLEDGE_KEY, fallbackKnowledgeItems);
  recordLocalAudit("知识库", "保存知识文档", String(id), true, `/api/knowledge/${id}`);
  return item;
}

function deleteFallbackKnowledge(id: number) {
  fallbackKnowledgeItems = readStoredKnowledge().filter((knowledge) => knowledge.id !== id);
  writeLocalItems(KNOWLEDGE_KEY, fallbackKnowledgeItems);
  recordLocalAudit("知识库", "删除知识文档", String(id), true, `/api/knowledge/${id}`);
  return true;
}

function readStoredKnowledge() {
  return readLocalItems<KnowledgeItem>(KNOWLEDGE_KEY, fallbackKnowledgeItems);
}
