import { assetItems } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { formatLocalDateTime, readLocalItems, upsertLocalItem, writeLocalItems } from "../../shared/localStore";
import type { AssetItem } from "./model";

const ASSETS_KEY = "bee-geo:fallback-assets";
let fallbackAssets = readLocalItems<AssetItem>(ASSETS_KEY, assetItems);

interface AssetResponse {
  id: number;
  name: string;
  type: string;
  tag: string;
  storageUrl?: string;
  enabled?: boolean;
  updatedAt: string;
}

export interface AssetCommand {
  name: string;
  type: string;
  tag: string;
  storageUrl?: string;
  enabled: boolean;
}

export function listAssets() {
  fallbackAssets = readStoredAssets();
  return withMockFallback(async (): Promise<AssetItem[]> => {
    const data = await apiGet<AssetResponse[]>("/assets");
    return data.map(mapAsset);
  }, fallbackAssets);
}

export async function createAsset(command: AssetCommand) {
  return withMockFallbackFactory(
    async () => mapAsset(await apiPost<AssetResponse>("/assets", command)),
    () => upsertFallbackAsset(command)
  );
}

export async function updateAsset(id: number, command: AssetCommand) {
  return withMockFallbackFactory(
    async () => mapAsset(await apiPut<AssetResponse>(`/assets/${id}`, command)),
    () => upsertFallbackAsset(command, id)
  );
}

export async function deleteAsset(id: number) {
  return withMockFallbackFactory(async () => apiDelete<boolean>(`/assets/${id}`), () => deleteFallbackAsset(id));
}

function mapAsset(item: AssetResponse): AssetItem {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    tag: item.tag,
    storageUrl: item.storageUrl,
    enabled: item.enabled,
    updatedAt: item.updatedAt,
  };
}

function upsertFallbackAsset(command: AssetCommand, id = Date.now()): AssetItem {
  const item: AssetItem = {
    id,
    name: command.name,
    type: command.type,
    tag: command.tag,
    storageUrl: command.storageUrl,
    enabled: command.enabled,
    updatedAt: formatLocalDateTime(),
  };
  fallbackAssets = upsertLocalItem(readStoredAssets(), item);
  writeLocalItems(ASSETS_KEY, fallbackAssets);
  recordLocalAudit("素材库", "保存素材", String(id), true, `/api/assets/${id}`);
  return item;
}

function deleteFallbackAsset(id: number) {
  fallbackAssets = readStoredAssets().filter((asset) => asset.id !== id);
  writeLocalItems(ASSETS_KEY, fallbackAssets);
  recordLocalAudit("素材库", "删除素材", String(id), true, `/api/assets/${id}`);
  return true;
}

function readStoredAssets() {
  return readLocalItems<AssetItem>(ASSETS_KEY, fallbackAssets);
}
