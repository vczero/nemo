FROM python:3.12-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    pkg-config \
    libcairo2-dev \
    python3-dev \
    libffi-dev \
    fontconfig \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 准备字体文件
RUN mkdir -p /usr/share/fonts/alibaba && \
    curl --resolve ywwlab-static.oss-cn-hangzhou.aliyuncs.com:443:115.238.6.127 \
    https://ywwlab-static.oss-cn-hangzhou.aliyuncs.com/docker-build/AlibabaPuHuiTi-3-45-Light.ttf \
    -o /usr/share/fonts/alibaba/AlibabaPuHuiTi-3-45-Light.ttf

# 复制应用代码
COPY src/requirements.txt src/requirements.txt

# 安装 Python 依赖
RUN cd src && pip install --no-cache-dir -r requirements.txt \
    --timeout 60 \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    --trusted-host mirrors.aliyun.com

COPY src/ src/

WORKDIR src

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
