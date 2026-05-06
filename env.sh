#!/usr/bin/env bash

# bee-geo 项目本地工具链环境。
# 使用方式：source ./env.sh

export BEE_GEO_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export JAVA_HOME="$BEE_GEO_HOME/.toolchains/amazon-corretto-17.jdk/Contents/Home"
export MAVEN_HOME="$BEE_GEO_HOME/.toolchains/apache-maven-3.9.15"
export PATH="$JAVA_HOME/bin:$MAVEN_HOME/bin:$PATH"
export DEBUG=false

# DeepSeek AI Provider（生产环境按需设置）
# export BEE_GEO_AI_PROVIDER=deepseek
# export DEEPSEEK_API_KEY=your-api-key
# export DEEPSEEK_MODEL=deepseek-v4-pro

echo "bee-geo 环境已加载"
echo "JAVA_HOME=$JAVA_HOME"
echo "MAVEN_HOME=$MAVEN_HOME"
