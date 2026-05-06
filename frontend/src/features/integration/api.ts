import { integrationAccounts } from "../../shared/mockData";
import { apiGet, apiPost, withMockFallback, withMockFallbackFactory } from "../../shared/http";
import { recordLocalAudit } from "../../shared/localAudit";
import { readLocalItems, writeLocalItems } from "../../shared/localStore";
import type { IntegrationAccount } from "../../shared/types";

const INTEGRATION_ACCOUNTS_KEY = "bee-geo:fallback-integration-accounts";
const defaultIntegrationAccounts = integrationAccounts.map((item) => ({
  ...item,
  accountId: item.accountId ?? (item.name === "官网主站" ? "site-main" : item.name === "博客园" ? "cnblogs" : item.name.toLowerCase()),
  platformCode: item.platformCode ?? (item.platform === "免费媒体" ? "FREE_MEDIA" : "OWNED_SITE"),
  platformName: item.platformName ?? item.platform,
}));
let fallbackIntegrationAccounts = readLocalItems<IntegrationAccount>(INTEGRATION_ACCOUNTS_KEY, defaultIntegrationAccounts);

export function listIntegrationAccounts() {
  fallbackIntegrationAccounts = readStoredAccounts();
  return withMockFallback<IntegrationAccount[]>(
    async () => {
      const data = await apiGet<IntegrationAccountResponse[]>("/integrations/accounts");
      return data.map(toItem);
    },
    fallbackIntegrationAccounts
  );
}

export function saveIntegrationCredential(payload: SaveCredentialPayload) {
  return withMockFallbackFactory(() => apiPost<void>("/integrations/accounts", payload), () => saveFallbackCredential(payload));
}

export function expireIntegrationCredential(accountId: string) {
  return withMockFallbackFactory(() => apiPost<void>("/integrations/accounts/expire", { accountId }), () => expireFallbackCredential(accountId));
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

function saveFallbackCredential(payload: SaveCredentialPayload) {
  fallbackIntegrationAccounts = readStoredAccounts().map((item) => {
    if (item.accountId !== payload.accountId) {
      return item;
    }
    return {
      ...item,
      platformCode: payload.platformCode,
      endpoint: "Token 已脱敏",
      maskedCredential: "Token 已脱敏",
      status: "VALID",
      expiresAt: nextYearDate(),
    };
  });
  writeLocalItems(INTEGRATION_ACCOUNTS_KEY, fallbackIntegrationAccounts);
  recordLocalAudit("集成设置", "更新授权凭据", payload.accountId, true, "/api/integrations/accounts");
}

function expireFallbackCredential(accountId: string) {
  fallbackIntegrationAccounts = readStoredAccounts().map((item) => (
    item.accountId === accountId
      ? { ...item, status: "EXPIRED", expiresAt: new Date().toISOString().slice(0, 10) }
      : item
  ));
  writeLocalItems(INTEGRATION_ACCOUNTS_KEY, fallbackIntegrationAccounts);
  recordLocalAudit("集成设置", "标记凭据过期", accountId, true, "/api/integrations/accounts/expire");
}

function nextYearDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function readStoredAccounts() {
  return readLocalItems<IntegrationAccount>(INTEGRATION_ACCOUNTS_KEY, fallbackIntegrationAccounts);
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
