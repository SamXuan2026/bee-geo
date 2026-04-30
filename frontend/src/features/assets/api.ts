import { assetItems } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback } from "../../shared/http";
import type { AssetItem } from "./model";

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
  return withMockFallback(async (): Promise<AssetItem[]> => {
    const data = await apiGet<AssetResponse[]>("/assets");
    return data.map(mapAsset);
  }, assetItems);
}

export async function createAsset(command: AssetCommand) {
  return mapAsset(await apiPost<AssetResponse>("/assets", command));
}

export async function updateAsset(id: number, command: AssetCommand) {
  return mapAsset(await apiPut<AssetResponse>(`/assets/${id}`, command));
}

export async function deleteAsset(id: number) {
  return apiDelete<boolean>(`/assets/${id}`);
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
