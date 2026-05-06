#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.runtime/backend.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "未找到后端进程文件，后端可能没有通过脚本启动。"
  exit 0
fi

PID="$(cat "$PID_FILE")"

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "已停止 bee-geo 后端，进程号：$PID"
else
  echo "后端进程不存在，清理进程文件。"
fi

rm -f "$PID_FILE"
