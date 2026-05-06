import { personaItems } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { formatLocalDateTime, readLocalItems, upsertLocalItem, writeLocalItems } from "../../shared/localStore";
import type { PersonaItem } from "./model";

const PERSONAS_KEY = "bee-geo:fallback-personas";
let fallbackPersonas = readLocalItems<PersonaItem>(PERSONAS_KEY, personaItems);

interface PersonaResponse {
  id: number;
  name: string;
  creator: string;
  role: string;
  tone?: string;
  status: "启用" | "停用";
  promptTemplate?: string;
  updatedAt?: string;
}

export interface PersonaCommand {
  name: string;
  creator: string;
  roleName: string;
  tone?: string;
  status: "启用" | "停用";
  promptTemplate?: string;
}

export function listPersonas() {
  fallbackPersonas = readStoredPersonas();
  return withMockFallback(async (): Promise<PersonaItem[]> => {
    const data = await apiGet<PersonaResponse[]>("/personas");
    return data.map(mapPersona);
  }, fallbackPersonas);
}

export async function createPersona(command: PersonaCommand) {
  return withMockFallbackFactory(
    async () => mapPersona(await apiPost<PersonaResponse>("/personas", command)),
    () => upsertFallbackPersona(command)
  );
}

export async function updatePersona(id: number, command: PersonaCommand) {
  return withMockFallbackFactory(
    async () => mapPersona(await apiPut<PersonaResponse>(`/personas/${id}`, command)),
    () => upsertFallbackPersona(command, id)
  );
}

export async function deletePersona(id: number) {
  return withMockFallbackFactory(async () => apiDelete<boolean>(`/personas/${id}`), () => deleteFallbackPersona(id));
}

function mapPersona(item: PersonaResponse): PersonaItem {
  return {
    id: item.id,
    name: item.name,
    creator: item.creator,
    role: item.role,
    tone: item.tone,
    status: item.status,
    promptTemplate: item.promptTemplate,
    updatedAt: item.updatedAt ?? "后端同步",
  };
}

function upsertFallbackPersona(command: PersonaCommand, id = Date.now()): PersonaItem {
  const item: PersonaItem = {
    id,
    name: command.name,
    creator: command.creator,
    role: command.roleName,
    tone: command.tone,
    status: command.status,
    promptTemplate: command.promptTemplate,
    updatedAt: formatLocalDateTime(),
  };
  fallbackPersonas = upsertLocalItem(readStoredPersonas(), item);
  writeLocalItems(PERSONAS_KEY, fallbackPersonas);
  recordLocalAudit("AI 人设", "保存 AI 人设", String(id), true, `/api/personas/${id}`);
  return item;
}

function deleteFallbackPersona(id: number) {
  fallbackPersonas = readStoredPersonas().filter((persona) => persona.id !== id);
  writeLocalItems(PERSONAS_KEY, fallbackPersonas);
  recordLocalAudit("AI 人设", "删除 AI 人设", String(id), true, `/api/personas/${id}`);
  return true;
}

function readStoredPersonas() {
  return readLocalItems<PersonaItem>(PERSONAS_KEY, fallbackPersonas);
}
