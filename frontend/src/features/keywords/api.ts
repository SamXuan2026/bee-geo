import { keywordGroups, keywords } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, mockRequest, withMockFallback } from "../../shared/http";
import type { KeywordGroup, KeywordItem } from "./model";

interface KeywordResponse {
  id: number;
  name: string;
  groupName: string;
  description?: string;
  enabled?: boolean;
  updatedAt: string;
}

export interface KeywordCommand {
  name: string;
  groupName: string;
  description?: string;
  enabled: boolean;
}

export function listKeywordGroups() {
  return withMockFallback(async () => {
    const items = await fetchKeywords();
    const descriptionMap = new Map(keywordGroups.map((group) => [group.name, group.description]));
    const groupMap = new Map<string, KeywordGroup>();
    items.forEach((item) => {
      const current = groupMap.get(item.group);
      groupMap.set(item.group, {
        id: current?.id ?? groupMap.size + 1,
        name: item.group,
        count: (current?.count ?? 0) + 1,
        description: descriptionMap.get(item.group) ?? "后端关键词分组",
      });
    });
    return Array.from(groupMap.values());
  }, keywordGroups);
}

export function listKeywords() {
  return withMockFallback(fetchKeywords, keywords);
}

async function fetchKeywords(): Promise<KeywordItem[]> {
  const data = await apiGet<KeywordResponse[]>("/keywords");
  return data.map(mapKeyword);
}

export async function createKeyword(command: KeywordCommand) {
  return mapKeyword(await apiPost<KeywordResponse>("/keywords", command));
}

export async function updateKeyword(id: number, command: KeywordCommand) {
  return mapKeyword(await apiPut<KeywordResponse>(`/keywords/${id}`, command));
}

export async function deleteKeyword(id: number) {
  return apiDelete<boolean>(`/keywords/${id}`);
}

function mapKeyword(item: KeywordResponse): KeywordItem {
  return {
    id: item.id,
    name: item.name,
    group: item.groupName,
    description: item.description,
    enabled: item.enabled,
    updatedAt: item.updatedAt,
  };
}
