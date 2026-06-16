#!/bin/bash
set -ex

# 打包 Spring Boot 项目
cd backend
gradle clean bootJar

# 创建临时目录
mkdir -p /tmp/nemo

# 复制 JAR 文件到临时目录（重命名为 nemo-copilot-web.jar）
cp nemo-copilot-web/build/libs/nemo-copilot-web-*.jar /tmp/nemo/nemo-copilot-web.jar

echo "Package created successfully: /tmp/nemo/nemo-copilot-web.jar"
