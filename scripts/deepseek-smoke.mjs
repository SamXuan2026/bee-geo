#!/usr/bin/env node

const baseUrl = (process.env.BEE_GEO_API_BASE || "http://127.0.0.1:8088").replace(/\/$/, "");
const operatorAccount = process.env.BEE_GEO_SMOKE_OPERATOR || process.env.VITE_OPERATOR_ACCOUNT || "13677889001";
const keyword = process.env.BEE_GEO_DEEPSEEK_SMOKE_KEYWORD || "DeepSeek真实联调验收";

function assertResult(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "X-Bee-Account": operatorAccount,
      ...(init.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok || payload.success !== true) {
    throw new Error(`接口失败：${path}，状态码：${response.status}，业务码：${payload.code || "UNKNOWN"}，消息：${payload.message || ""}`);
  }
  return payload.data;
}

async function main() {
  assertResult(process.env.BEE_GEO_AI_PROVIDER === "deepseek", "请先设置 BEE_GEO_AI_PROVIDER=deepseek");
  assertResult(Boolean(process.env.DEEPSEEK_API_KEY), "请先设置 DEEPSEEK_API_KEY");

  const health = await request("/api/health");
  assertResult(health.status === "UP", "后端健康状态必须为 UP");

  const provider = await request("/api/ai/provider");
  assertResult(provider.providerName === "DeepSeek", `当前后端 AI Provider 不是 DeepSeek，实际为：${provider.providerName}`);
  assertResult(provider.remoteProvider === true, "当前后端 AI Provider 必须是远程模型");

  const task = await request("/api/geo/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
  });
  assertResult(task.id, "GEO 任务必须返回编号");
  assertResult(Array.isArray(task.questions) && task.questions.length > 0, "DeepSeek 必须返回 GEO 研究问题");

  const results = await request(`/api/geo/tasks/${task.id}/results`);
  assertResult(Array.isArray(results) && results.length > 0, "GEO 结果不能为空");
  for (const result of results) {
    assertResult(result.media === "DeepSeek", `GEO 结果来源必须为 DeepSeek，实际为：${result.media}`);
    assertResult(Boolean(result.question), "DeepSeek 结果必须包含研究问题");
    assertResult(Boolean(result.aiTitle), "DeepSeek 结果必须包含内容标题");
    assertResult(Boolean(result.description), "DeepSeek 结果必须包含分析说明");
    assertResult(result.url === "", "DeepSeek 结果不得生成本地假链接");
    assertResult(!String(result.aiTitle || "").includes("example.local"), "DeepSeek 标题不得包含本地假链接");
  }

  console.log(`DeepSeek 联调检查通过：任务 ${task.id}，问题 ${task.questions.length} 条，地址：${baseUrl}，操作人：${operatorAccount}`);
}

main().catch(error => {
  console.error(`DeepSeek 联调检查失败：${error.message}`);
  process.exit(1);
});
