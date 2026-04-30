import { knowledgeItems } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback } from "../../shared/http";
import type { KnowledgeItem } from "./model";

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
  return withMockFallback(async (): Promise<KnowledgeItem[]> => {
    const data = await apiGet<KnowledgeResponse[]>("/knowledge");
    return data.map(mapKnowledge);
  }, knowledgeItems);
}

export async function createKnowledgeItem(command: KnowledgeCommand) {
  return mapKnowledge(await apiPost<KnowledgeResponse>("/knowledge", command));
}

export async function updateKnowledgeItem(id: number, command: KnowledgeCommand) {
  return mapKnowledge(await apiPut<KnowledgeResponse>(`/knowledge/${id}`, command));
}

export async function deleteKnowledgeItem(id: number) {
  return apiDelete<boolean>(`/knowledge/${id}`);
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
