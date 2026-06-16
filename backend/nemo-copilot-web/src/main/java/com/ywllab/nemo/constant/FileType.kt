package com.ywllab.nemo.constant

enum class FileType(desc: String) {
    CHART("图表数据"),
    AVATAR("用户头像"),
    CHART_THUMBNAIL("图表缩略图"),
    INVOICE("发票原件"),
    COMPUTE_INPUT("计算输入文件"),
    COMPUTE_OUTPUT("计算输出文件"),
    LLM_INPUT_CACHE("LLM输入缓存"),
    SYSTEM_CONFIG("系统配置图片")
}
