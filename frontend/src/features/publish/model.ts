export type { PublishAccount, PublishReceipt, PublishTask } from "../../shared/types";

export interface PublishTaskForm {
  contentId: string;
  title: string;
  body: string;
  platformCode: string;
  accountId: string;
  scheduledAt: string;
  maxRetryCount: string;
}
