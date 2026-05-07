#!/usr/bin/env bash

# bee-geo 项目本地工具链环境。
# 使用方式：source ./env.sh

export BEE_GEO_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export JAVA_HOME="$BEE_GEO_HOME/.toolchains/amazon-corretto-17.jdk/Contents/Home"
export MAVEN_HOME="$BEE_GEO_HOME/.toolchains/apache-maven-3.9.15"
export PATH="$JAVA_HOME/bin:$MAVEN_HOME/bin:$PATH"
export DEBUG=false

LOCAL_ENV_FILE="$BEE_GEO_HOME/.env.local"
if [ -f "$LOCAL_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$LOCAL_ENV_FILE"
  set +a
fi

# DeepSeek AI Provider（生产环境按需设置）
# 启用真实 DeepSeek 时必须同时设置 BEE_GEO_AI_PROVIDER 和 DEEPSEEK_API_KEY。
# 前端联调真实模型时建议关闭 mock 兜底，避免后端错误被本地数据掩盖。
# export BEE_GEO_AI_PROVIDER=deepseek
# export DEEPSEEK_API_KEY=your-api-key
# export DEEPSEEK_BASE_URL=https://api.deepseek.com
# export DEEPSEEK_MODEL=deepseek-v4-pro
# export VITE_OPERATOR_ACCOUNT=13677889001
# export VITE_ENABLE_MOCK_FALLBACK=false

echo "bee-geo 环境已加载"
echo "JAVA_HOME=$JAVA_HOME"
echo "MAVEN_HOME=$MAVEN_HOME"
if [ -f "$LOCAL_ENV_FILE" ]; then
  echo "本地环境文件已加载：$LOCAL_ENV_FILE"
fi
