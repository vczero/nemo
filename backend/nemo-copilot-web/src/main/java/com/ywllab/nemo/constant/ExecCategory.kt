package com.ywllab.nemo.constant

/**
 * 执行器类别枚举
 */
enum class ExecCategory(val desc: String) {
    ML_MODEL("传统机器学习模型"),
    LLM("大语言模型");

    companion object {
        fun fromValue(value: String): ExecCategory {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid ExecCategory value: $value")
        }
    }
}
