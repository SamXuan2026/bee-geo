import { integrationAccounts } from "../../shared/mockData";
import { apiGet, apiPost, withMockFallback } from "../../shared/http";
import type { IntegrationAccount } from "../../shared/types";

export function listIntegrationAccounts() {
  return withMockFallback<IntegrationAccount[]>(
    async () => {
      const data = await apiGet<IntegrationAccountResponse[]>("/integrations/accounts");
      return data.map(toItem);
    },
    integrationAccounts
  );
}

export function saveIntegrationCredential(payload: SaveCredentialPayload) {
  return apiPost<void>("/integrations/accounts", payload);
}

export function expireIntegrationCredential(accountId: string) {
  return apiPost<void>("/integrations/accounts/expire", { accountId });
}

interface IntegrationAccountResponse {
  id: number;
  accountId: string;
  name: string;
  platformCode: string;
  platformName: string;
  endpoint: string;
  maskedCredential: string;
  status: IntegrationAccount["status"];
  expiresAt: string;
}

export interface SaveCredentialPayload {
  accountId: string;
  platformCode: string;
  secretValue: string;
}

function toItem(response: IntegrationAccountResponse): IntegrationAccount {
  return {
    id: response.id,
    accountId: response.accountId,
    name: response.name,
    platformCode: response.platformCode,
    platformName: response.platformName,
    platform: response.platformName,
    endpoint: response.maskedCredential || response.endpoint,
    maskedCredential: response.maskedCredential,
    status: response.status,
    expiresAt: response.expiresAt,
  };
}
