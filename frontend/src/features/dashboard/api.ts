import { mockRequest } from "../../shared/http";
import type { DashboardMetric, DashboardTodo } from "./model";

export function getDashboardMetrics() {
  const data: DashboardMetric[] = [
    { label: "GEO 任务", value: "128", hint: "本周新增 26 个" },
    { label: "内容产出", value: "42", hint: "待审核 9 篇" },
    { label: "发布成功率", value: "96%", hint: "失败任务 2 个" },
    { label: "账号异常", value: "1", hint: "需要重新授权" },
  ];
  return mockRequest(data);
}

export function getDashboardTodos() {
  const data: DashboardTodo[] = [
    { title: "CSDN 授权需要重新登录", module: "集成设置", priority: "高" },
    { title: "企业协同平台文章等待审核", module: "AI 创作", priority: "中" },
    { title: "免费媒体发布失败需要人工介入", module: "发布中心", priority: "高" },
  ];
  return mockRequest(data);
}
