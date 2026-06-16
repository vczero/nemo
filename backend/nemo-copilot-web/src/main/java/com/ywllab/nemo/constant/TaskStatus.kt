package com.ywllab.nemo.constant

/**
 * 任务状态枚举
 */
enum class TaskStatus(val desc: String) {
    PENDING("待处理"),
    RUNNING("执行中"),
    SUCCESS("执行成功"),
    FAILED("执行失败"),
    CANCELLED("已取消");

    companion object {
        fun fromValue(value: String): TaskStatus {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid TaskStatus value: $value")
        }
    }
}
