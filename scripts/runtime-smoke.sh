#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_ROOT/env.sh"

RUNTIME_DIR="$PROJECT_ROOT/.runtime"
LOG_FILE="$RUNTIME_DIR/runtime-backend.log"
PID_FILE="$RUNTIME_DIR/runtime-backend.pid"

API_BASE="${BEE_GEO_API_BASE:-http://127.0.0.1:8088}"
START_BACKEND="${BEE_GEO_RUNTIME_START_BACKEND:-true}"
RUN_API_SMOKE="${BEE_GEO_RUNTIME_API:-true}"
RUN_BROWSER_SMOKE="${BEE_GEO_RUNTIME_BROWSER:-true}"
BUILD_FRONTEND="${BEE_GEO_RUNTIME_BUILD_FRONTEND:-true}"
KEEP_BACKEND="${BEE_GEO_RUNTIME_KEEP_BACKEND:-false}"
WAIT_SECONDS="${BEE_GEO_RUNTIME_WAIT_SECONDS:-60}"

BACKEND_PID=""

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

mkdir -p "$RUNTIME_DIR"

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
  tail -n 120 "$LOG_FILE" 2>/dev/null || true
  return 1
}

start_backend() {
  if [ "$START_BACKEND" != "true" ]; then
    echo "跳过后端启动，使用已有后端：$API_BASE"
    wait_for_backend
    return
  fi

  echo "启动后端运行态服务：$API_BASE"
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

run_api_smoke() {
  if [ "$RUN_API_SMOKE" != "true" ]; then
    echo "跳过运行态 API 冒烟检查"
    return
  fi

  echo "执行运行态 API 冒烟检查"
  BEE_GEO_API_BASE="$API_BASE" "$PROJECT_ROOT/scripts/api-smoke.sh"
}

run_browser_smoke() {
  if [ "$RUN_BROWSER_SMOKE" != "true" ]; then
    echo "跳过浏览器点击冒烟检查"
    return
  fi

  cd "$PROJECT_ROOT/frontend"
  if [ "$BUILD_FRONTEND" = "true" ]; then
    echo "构建前端产物"
    npm run build
  fi
  echo "执行浏览器点击冒烟检查"
  npm run browser-click-smoke
}

if [ "$RUN_API_SMOKE" = "true" ]; then
  start_backend
  run_api_smoke
else
  echo "跳过后端启动和运行态 API 冒烟检查"
fi
run_browser_smoke

echo "运行态验收闭环通过"
