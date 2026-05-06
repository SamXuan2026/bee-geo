#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_ROOT/env.sh"

RUNTIME_DIR="$PROJECT_ROOT/.runtime"
PID_FILE="$RUNTIME_DIR/backend.pid"
LOG_FILE="$RUNTIME_DIR/backend.log"

mkdir -p "$RUNTIME_DIR"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "bee-geo 后端已在运行，进程号：$(cat "$PID_FILE")"
  exit 0
fi

cd "$PROJECT_ROOT/backend"
nohup mvn -Dmaven.repo.local="$PROJECT_ROOT/.m2/repository" -DskipTests spring-boot:run > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "bee-geo 后端启动中，进程号：$(cat "$PID_FILE")"
echo "日志文件：$LOG_FILE"
echo "健康检查：http://127.0.0.1:8088/api/health"
