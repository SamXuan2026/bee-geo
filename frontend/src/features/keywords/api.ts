import { keywordGroups, keywords } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { formatLocalDate, readLocalItems, upsertLocalItem, writeLocalItems } from "../../shared/localStore";
import type { KeywordGroup, KeywordItem } from "./model";

const KEYWORDS_KEY = "bee-geo:fallback-keywords";
let fallbackKeywords = readLocalItems<KeywordItem>(KEYWORDS_KEY, keywords);

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
    return buildKeywordGroups(items);
  }, buildKeywordGroups(readStoredKeywords()));
}

export function listKeywords() {
  fallbackKeywords = readStoredKeywords();
  return withMockFallback(fetchKeywords, fallbackKeywords);
}

async function fetchKeywords(): Promise<KeywordItem[]> {
  const data = await apiGet<KeywordResponse[]>("/keywords");
  return data.map(mapKeyword);
}

export async function createKeyword(command: KeywordCommand) {
  return withMockFallbackFactory(
    async () => mapKeyword(await apiPost<KeywordResponse>("/keywords", command)),
    () => upsertFallbackKeyword(command)
  );
}

export async function updateKeyword(id: number, command: KeywordCommand) {
  return withMockFallbackFactory(
    async () => mapKeyword(await apiPut<KeywordResponse>(`/keywords/${id}`, command)),
    () => upsertFallbackKeyword(command, id)
  );
}

export async function deleteKeyword(id: number) {
  return withMockFallbackFactory(async () => apiDelete<boolean>(`/keywords/${id}`), () => deleteFallbackKeyword(id));
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

function upsertFallbackKeyword(command: KeywordCommand, id = Date.now()): KeywordItem {
  const item: KeywordItem = {
    id,
    name: command.name,
    group: command.groupName,
    description: command.description,
    enabled: command.enabled,
    updatedAt: formatLocalDate(),
  };
  fallbackKeywords = upsertLocalItem(readStoredKeywords(), item);
  writeLocalItems(KEYWORDS_KEY, fallbackKeywords);
  recordLocalAudit("关键词库", "保存关键词", String(id), true, `/api/keywords/${id}`);
  return item;
}

function deleteFallbackKeyword(id: number) {
  fallbackKeywords = readStoredKeywords().filter((keyword) => keyword.id !== id);
  writeLocalItems(KEYWORDS_KEY, fallbackKeywords);
  recordLocalAudit("关键词库", "删除关键词", String(id), true, `/api/keywords/${id}`);
  return true;
}

function readStoredKeywords() {
  return readLocalItems<KeywordItem>(KEYWORDS_KEY, fallbackKeywords);
}

function buildKeywordGroups(items: KeywordItem[]) {
  const descriptionMap = new Map(keywordGroups.map((group) => [group.name, group.description]));
  const groupMap = new Map<string, KeywordGroup>();
  items.forEach((item) => {
    const current = groupMap.get(item.group);
    groupMap.set(item.group, {
      id: current?.id ?? groupMap.size + 1,
      name: item.group,
      count: (current?.count ?? 0) + 1,
      description: descriptionMap.get(item.group) ?? "本地关键词分组",
    });
  });
  return Array.from(groupMap.values());
}
