import type { ContentStatus, CredentialStatus } from "./types";

export const contentStatusText: Record<ContentStatus, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  APPROVED: "审核通过",
  SCHEDULED: "已排期",
  PUBLISHING: "发布中",
  PUBLISHED: "发布成功",
  FAILED: "发布失败",
  MANUAL_REQUIRED: "人工介入",
  REVOKED: "已撤回",
  REJECTED: "已驳回",
};

export const credentialStatusText: Record<CredentialStatus, string> = {
  VALID: "有效",
  EXPIRED: "已过期",
  INVALID: "无效",
  NEED_REAUTH: "需要重新授权",
};

export const contentTransitions: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["SCHEDULED"],
  SCHEDULED: ["PUBLISHING", "REVOKED"],
  PUBLISHING: ["PUBLISHED", "FAILED"],
  PUBLISHED: [],
  FAILED: ["MANUAL_REQUIRED", "PUBLISHING"],
  MANUAL_REQUIRED: ["PUBLISHING", "REVOKED"],
  REVOKED: [],
  REJECTED: ["DRAFT"],
};
