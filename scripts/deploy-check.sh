#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ERROR_COUNT=0

fail() {
  echo "[失败] $1"
  ERROR_COUNT=$((ERROR_COUNT + 1))
}

pass() {
  echo "[通过] $1"
}

require_file() {
  local path="$1"
  if [[ -f "$PROJECT_ROOT/$path" ]]; then
    pass "文件存在：$path"
  else
    fail "文件缺失：$path"
  fi
}

require_glob() {
  local pattern="$1"
  if compgen -G "$PROJECT_ROOT/$pattern" >/dev/null; then
    pass "文件匹配：$pattern"
  else
    fail "文件缺失：$pattern"
  fi
}

require_content() {
  local path="$1"
  local pattern="$2"
  local label="$3"
  if grep -q "$pattern" "$PROJECT_ROOT/$path"; then
    pass "$label"
  else
    fail "$label"
  fi
}

echo "bee-geo 部署检查开始"

require_file "deploy/docker-compose.yml"
require_file "deploy/nginx.conf"
require_file "deploy/sql/postgresql/schema.sql"
require_file "backend/src/main/resources/application.yml"
require_file "backend/src/main/resources/application-prod.yml"
require_file "frontend/dist/index.html"
require_glob "frontend/dist/assets/*.js"
require_glob "frontend/dist/assets/*.css"

require_content "deploy/docker-compose.yml" "bee-geo-postgres" "Compose 包含 PostgreSQL 服务"
require_content "deploy/docker-compose.yml" "BEE_GEO_DB_URL" "Compose 注入数据库连接"
require_content "deploy/docker-compose.yml" "BEE_GEO_DB_PASSWORD:.*:?" "Compose 强制生产数据库密码"
require_content "deploy/docker-compose.yml" "BEE_GEO_CREDENTIAL_SECRET:.*:?" "Compose 强制生产凭据加密密钥"
require_content "deploy/docker-compose.yml" "BEE_GEO_REQUIRE_OPERATOR_HEADER.*true" "Compose 开启操作人请求头要求"
require_content "deploy/docker-compose.yml" "BEE_GEO_SEED_DEMO_CREDENTIALS.*false" "Compose 关闭演示凭据种子"

require_content "deploy/nginx.conf" "location /api/" "Nginx 配置 API 反向代理"
require_content "deploy/nginx.conf" "proxy_pass http://bee-geo-backend:8088/api/" "Nginx API 指向后端容器"
require_content "deploy/nginx.conf" "X-Frame-Options" "Nginx 设置点击劫持防护头"
require_content "deploy/nginx.conf" "X-Content-Type-Options" "Nginx 设置 MIME 嗅探防护头"

require_content "backend/src/main/resources/application-prod.yml" "BEE_GEO_DB_URL" "生产配置读取数据库地址环境变量"
require_content "backend/src/main/resources/application.yml" "BEE_GEO_CREDENTIAL_SECRET" "应用配置读取凭据加密密钥环境变量"
require_content "backend/src/main/resources/application.yml" "BEE_GEO_REQUIRE_OPERATOR_HEADER" "应用配置支持强制操作人请求头"

for table in keywords knowledge_items assets personas app_users geo_tasks geo_results creations publish_accounts publish_credentials publish_tasks publish_receipts audit_logs; do
  require_content "deploy/sql/postgresql/schema.sql" "CREATE TABLE IF NOT EXISTS $table" "初始化脚本包含表：$table"
done

if [[ "$ERROR_COUNT" -gt 0 ]]; then
  echo "bee-geo 部署检查失败：$ERROR_COUNT 项"
  exit 1
fi

echo "bee-geo 部署检查通过"
