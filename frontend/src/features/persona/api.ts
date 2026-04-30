import { personaItems } from "../../shared/mockData";
import { apiDelete, apiGet, apiPost, apiPut, withMockFallback } from "../../shared/http";
import type { PersonaItem } from "./model";

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
  return withMockFallback(async (): Promise<PersonaItem[]> => {
    const data = await apiGet<PersonaResponse[]>("/personas");
    return data.map(mapPersona);
  }, personaItems);
}

export async function createPersona(command: PersonaCommand) {
  return mapPersona(await apiPost<PersonaResponse>("/personas", command));
}

export async function updatePersona(id: number, command: PersonaCommand) {
  return mapPersona(await apiPut<PersonaResponse>(`/personas/${id}`, command));
}

export async function deletePersona(id: number) {
  return apiDelete<boolean>(`/personas/${id}`);
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
