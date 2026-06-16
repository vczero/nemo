package com.ywllab.nemo.constant

enum class ModelClass(val display: String) {
    TEXT_GENERATION("文本生成"),
    EMBEDDING("向量模型"),
    RERANKING("排序模型"),
    IMAGE_UNDERSTAND("视觉理解"),
    IMAGE_GENERATION("图片生成"),
    VIDEO_GENERATION("视频生成"),
    ASR("语音识别"),
    OMNI("全模态"),
    FILE("文件管理"),
    OTHER("其他"),
}
