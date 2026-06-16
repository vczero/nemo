# 使用你当前的镜像作为基础镜像
FROM adoptopenjdk/openjdk8:x86_64-centos-jre8u472-b08

RUN mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
RUN curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo

# 安装字体库
RUN yum install -y \
    freetype \
    fontconfig \
    && yum clean all

# 准备字体
RUN mkdir -p /usr/share/fonts/alibaba
RUN curl https://fonts.aliyun.com/AlibabaPuHuiTi-3-45-Light.ttf \
    -o /usr/share/fonts/alibaba/AlibabaPuHuiTi-3-45-Light.ttf
RUN fc-cache -fv

# 设置 JVM 参数
ENV JAVA_OPTS="-Djava.awt.headless=true -Djava2d.font.fontpath=/usr/share/fonts"

# docker build -t openjdk8:x86_64-centos-jre8u472 .
