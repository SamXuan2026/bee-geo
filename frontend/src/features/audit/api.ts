import { apiGet, withMockFallback } from "../../shared/http";
import { listLocalAuditLogs } from "../../shared/localAudit";
import type { AuditLogItem } from "./model";

export interface AuditLogQuery {
  keyword?: string;
  success?: "true" | "false" | "";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogPage {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogExport {
  fileName: string;
  contentType: string;
  content: string;
}

export function listAuditLogs(query: AuditLogQuery = {}) {
  return listAuditLogPage({ ...query, pageSize: 100 }).then((page) => page.items);
}

export function listAuditLogPage(query: AuditLogQuery = {}): Promise<AuditLogPage> {
  const search = new URLSearchParams();
  if (query.keyword?.trim()) {
    search.set("keyword", query.keyword.trim());
  }
  if (query.success) {
    search.set("success", query.success);
  }
  if (query.startDate) {
    search.set("startDate", query.startDate);
  }
  if (query.endDate) {
    search.set("endDate", query.endDate);
  }
  search.set("page", String(query.page ?? 1));
  search.set("pageSize", String(query.pageSize ?? 10));
  const path = `/audit/logs/page?${search.toString()}`;
  return withMockFallback(
    async () => {
      const data = await apiGet<AuditLogPageResponse>(path);
      return {
        ...data,
        items: data.items.map(toItem),
      };
    },
    pageLocalAuditLogs(query)
  );
}

export function exportAuditLogs(query: AuditLogQuery = {}) {
  const search = new URLSearchParams();
  if (query.keyword?.trim()) {
    search.set("keyword", query.keyword.trim());
  }
  if (query.success) {
    search.set("success", query.success);
  }
  if (query.startDate) {
    search.set("startDate", query.startDate);
  }
  if (query.endDate) {
    search.set("endDate", query.endDate);
  }
  const path = search.toString() ? `/audit/logs/export?${search.toString()}` : "/audit/logs/export";
  return withMockFallback(
    () => apiGet<AuditLogExport>(path),
    exportLocalAuditLogs(query)
  );
}

interface AuditLogResponse {
  id: number;
  module: string;
  action: string;
  targetId?: string;
  operatorAccount: string;
  operatorName: string;
  operatorRole: string;
  clientIp: string;
  requestUri: string;
  success: boolean;
  createdAt: string;
}

interface AuditLogPageResponse {
  items: AuditLogResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toItem(response: AuditLogResponse): AuditLogItem {
  return {
    ...response,
    createdAt: response.createdAt.replace("T", " ").slice(0, 16),
  };
}

function filterLocalAuditLogs(query: AuditLogQuery) {
  const keyword = query.keyword?.trim().toLowerCase();
  return listLocalAuditLogs().filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.module.toLowerCase().includes(keyword) ||
      item.action.toLowerCase().includes(keyword) ||
      item.operatorAccount.toLowerCase().includes(keyword) ||
      item.operatorName.toLowerCase().includes(keyword) ||
      item.requestUri.toLowerCase().includes(keyword);
    const matchesSuccess = !query.success || String(item.success) === query.success;
    const itemDate = item.createdAt.slice(0, 10);
    const matchesStart = !query.startDate || itemDate >= query.startDate;
    const matchesEnd = !query.endDate || itemDate <= query.endDate;
    return matchesKeyword && matchesSuccess && matchesStart && matchesEnd;
  });
}

function pageLocalAuditLogs(query: AuditLogQuery): AuditLogPage {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 10, 1), 100);
  const filtered = filterLocalAuditLogs(query);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return {
    items,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(filtered.length / pageSize), 1),
  };
}

function exportLocalAuditLogs(query: AuditLogQuery): AuditLogExport {
  const header = ["模块", "动作", "对象编号", "操作账号", "操作人", "角色", "客户端IP", "请求地址", "结果", "时间"];
  const rows = filterLocalAuditLogs(query).map((item) => [
    item.module,
    item.action,
    item.targetId ?? "",
    item.operatorAccount,
    item.operatorName,
    item.operatorRole,
    item.clientIp,
    item.requestUri,
    item.success ? "成功" : "失败",
    item.createdAt,
  ]);
  return {
    fileName: `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
    contentType: "text/csv;charset=utf-8",
    content: [header, ...rows].map((row) => row.map(csv).join(",")).join("\n"),
  };
}

function csv(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}
