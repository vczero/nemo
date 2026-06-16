package com.ywllab.nemo.constant

/**
 * 分类类型枚举
 */
enum class ClassificationType(val desc: String) {
    /**
     * 单分类：每个文本只属于一个类别
     */
    SINGLE_CLASS("单分类"),

    /**
     * 多分类：每个文本可以属于一个或多个类别
     */
    MULTI_CLASS("多分类");

    companion object {
        fun fromValue(value: String?): ClassificationType? {
            if (value == null) return null
            return values().find { it.name == value || it.name == value.replace("_", "") }
        }
    }
}
