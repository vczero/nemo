package com.ywllab.nemo.constant

enum class SseEventType {
    // 设置引用
    SET_REFER,

    // 设置工具调用
    SET_TOOL,

    // 思考文本
    DELTA_REASONING_TEXT,

    // 追加文本
    DELTA_TEXT,

    // 结束
    DONE,

    // 登录过期
    SESSION_EXPIRE,

    // 其他异常
    ERROR,
}
