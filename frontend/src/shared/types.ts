export type ModuleKey =
  | "dashboard"
  | "keywords"
  | "knowledge"
  | "assets"
  | "geo"
  | "creation"
  | "persona"
  | "publish"
  | "integration"
  | "users"
  | "audit"
  | "permission";

export type UserRoleCode = "SUPER_ADMIN" | "CONTENT_ADMIN" | "REVIEWER" | "PUBLISHER" | "READONLY_VIEWER";

export type ContentStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED"
  | "MANUAL_REQUIRED"
  | "REVOKED"
  | "REJECTED";

export type CredentialStatus = "VALID" | "EXPIRED" | "INVALID" | "NEED_REAUTH";

export interface KeywordGroup {
  id: number;
  name: string;
  count: number;
  description: string;
}

export interface KeywordItem {
  id: number;
  name: string;
  group: string;
  description?: string;
  enabled?: boolean;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: number;
  name: string;
  type: string;
  group: string;
  content?: string;
  enabled?: boolean;
  updatedAt: string;
}

export interface AssetItem {
  id: number;
  name: string;
  tag: string;
  type: string;
  storageUrl?: string;
  enabled?: boolean;
  updatedAt: string;
}

export interface GeoTask {
  id: number;
  taskId?: number;
  keyword?: string;
  question: string;
  status: "已完成" | "分析中" | "待处理";
  createdAt: string;
  questions?: string[];
}

export interface GeoReference {
  id: number;
  keyword: string;
  question: string;
  aiTitle: string;
  url: string;
  media: string;
  description: string;
}

export interface CreationItem {
  id: number;
  geoTaskId?: number;
  title: string;
  brand: string;
  platform: string;
  summary?: string;
  body?: string;
  publishAt: string;
  status: ContentStatus;
}

export interface PersonaItem {
  id: number;
  name: string;
  creator: string;
  role: string;
  tone?: string;
  promptTemplate?: string;
  updatedAt: string;
  status: "启用" | "停用";
}

export interface PublishTask {
  id: number;
  contentId?: number;
  title: string;
  platform: string;
  platformCode?: string;
  account: string;
  accountId?: string;
  scheduledAt: string;
  status: ContentStatus;
  retryCount: number;
  maxRetryCount?: number;
  receipt: string;
  url?: string;
  externalPublishId?: string;
  lastAttemptAt?: string;
  publishedAt?: string;
}

export interface PublishAccount {
  id: number;
  accountId: string;
  name: string;
  platformCode: string;
  platformName: string;
  endpoint: string;
  status: CredentialStatus;
  expiresAt: string;
}

export interface PublishReceipt {
  id: number;
  taskId: number;
  platformCode: string;
  accountId: string;
  attemptNo: number;
  success: boolean;
  externalPublishId?: string;
  url?: string;
  message: string;
  publishedAt?: string;
  createdAt: string;
}

export interface IntegrationAccount {
  id: number;
  accountId?: string;
  name: string;
  platformCode?: string;
  platformName?: string;
  platform: string;
  endpoint: string;
  maskedCredential?: string;
  status: CredentialStatus;
  expiresAt: string;
}

export interface UserItem {
  id: number;
  name: string;
  account: string;
  roleCode?: string;
  status?: string;
  role: string;
  phone: string;
  updatedAt: string;
}

export interface AuditLogItem {
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

export interface PermissionMatrixItem {
  id: number;
  module: string;
  permission: string;
  description: string;
  riskLevel: "高" | "中" | "低";
  roles: string[];
  backendGuarded: boolean;
}
