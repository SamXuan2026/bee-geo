#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_ROOT/env.sh"

RUNTIME_DIR="$PROJECT_ROOT/.runtime"
LOG_FILE="$RUNTIME_DIR/deepseek-runtime-backend.log"
PID_FILE="$RUNTIME_DIR/deepseek-runtime-backend.pid"

API_BASE="${BEE_GEO_API_BASE:-http://127.0.0.1:8088}"
START_BACKEND="${BEE_GEO_DEEPSEEK_RUNTIME_START_BACKEND:-true}"
KEEP_BACKEND="${BEE_GEO_DEEPSEEK_RUNTIME_KEEP_BACKEND:-false}"
BUILD_FRONTEND="${BEE_GEO_DEEPSEEK_RUNTIME_BUILD_FRONTEND:-true}"
WAIT_SECONDS="${BEE_GEO_DEEPSEEK_RUNTIME_WAIT_SECONDS:-90}"

BACKEND_PID=""

require_deepseek_env() {
  if [ "${BEE_GEO_AI_PROVIDER:-}" != "deepseek" ]; then
    echo "请先设置 BEE_GEO_AI_PROVIDER=deepseek"
    exit 1
  fi
  if [ -z "${DEEPSEEK_API_KEY:-}" ]; then
    echo "请先设置 DEEPSEEK_API_KEY"
    exit 1
  fi
}

cleanup() {
  if [ "$KEEP_BACKEND" = "true" ]; then
    return
  fi
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
}

trap cleanup EXIT

wait_for_backend() {
  local deadline
  deadline=$((SECONDS + WAIT_SECONDS))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if curl -fsS "$API_BASE/api/health" >/dev/null 2>&1; then
      echo "后端健康检查通过：$API_BASE/api/health"
      return 0
    fi
    sleep 1
  done

  echo "后端健康检查超时：$API_BASE/api/health"
  echo "最近后端日志："
  tail -n 160 "$LOG_FILE" 2>/dev/null || true
  return 1
}

start_backend() {
  if [ "$START_BACKEND" != "true" ]; then
    echo "跳过后端启动，使用已有后端：$API_BASE"
    wait_for_backend
    return
  fi

  mkdir -p "$RUNTIME_DIR"
  echo "启动 DeepSeek 真实联调后端：$API_BASE"
  (
    cd "$PROJECT_ROOT/backend"
    mvn -Dmaven.repo.local="$PROJECT_ROOT/.m2/repository" -DskipTests spring-boot:run
  ) > "$LOG_FILE" 2>&1 &
  BACKEND_PID="$!"
  echo "$BACKEND_PID" > "$PID_FILE"
  echo "后端进程号：$BACKEND_PID"
  echo "后端日志：$LOG_FILE"

  wait_for_backend
}

build_frontend_real() {
  if [ "$BUILD_FRONTEND" != "true" ]; then
    echo "跳过前端真实模式构建"
    return
  fi

  echo "执行前端真实模式构建"
  (
    cd "$PROJECT_ROOT/frontend"
    npm run build:real
  )
}

require_deepseek_env
start_backend
BEE_GEO_API_BASE="$API_BASE" "$PROJECT_ROOT/scripts/deepseek-smoke.sh"
build_frontend_real

echo "DeepSeek 真实运行态验收通过"
