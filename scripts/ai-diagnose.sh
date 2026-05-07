#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_ROOT/env.sh" >/dev/null

API_BASE="${BEE_GEO_API_BASE:-http://127.0.0.1:8088}"
FRONTEND_URL="${BEE_GEO_FRONTEND_URL:-http://127.0.0.1:5178}"
OPERATOR="${BEE_GEO_SMOKE_OPERATOR:-${VITE_OPERATOR_ACCOUNT:-13677889001}}"

echo "AI 联调诊断开始"
echo "后端地址：$API_BASE"
echo "前端地址：$FRONTEND_URL"
echo "操作人：$OPERATOR"
echo "AI Provider 配置：${BEE_GEO_AI_PROVIDER:-未设置}"
echo "DeepSeek 模型：${DEEPSEEK_MODEL:-未设置}"

if [ -n "${DEEPSEEK_API_KEY:-}" ]; then
  echo "DeepSeek Key：已设置"
else
  echo "DeepSeek Key：未设置"
fi

if [ "${VITE_ENABLE_MOCK_FALLBACK:-true}" = "false" ]; then
  echo "前端兜底：已关闭"
else
  echo "前端兜底：已开启或未设置"
fi

echo "检查后端健康："
if curl -fsS "$API_BASE/api/health" >/dev/null 2>&1; then
  echo "后端健康：通过"
else
  echo "后端健康：失败"
fi

echo "检查后端 AI Provider："
if curl -fsS -H "X-Bee-Account: $OPERATOR" "$API_BASE/api/ai/provider" 2>/dev/null; then
  echo
else
  echo "AI Provider 接口：不可访问"
fi

echo "检查前端入口："
if curl -fsSI "$FRONTEND_URL" >/dev/null 2>&1; then
  echo "前端入口：通过"
else
  echo "前端入口：失败"
fi

echo "AI 联调诊断结束"
