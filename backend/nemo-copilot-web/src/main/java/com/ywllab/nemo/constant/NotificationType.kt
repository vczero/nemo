package com.ywllab.nemo.constant

enum class NotificationType(var desc: String) {
    SYSTEM("系统通知"),
    INVOICE("开票通知"),
    COMPUTE("计算任务"),
    OTHER("其他")
    ;

    companion object {
        fun fromValue(value: String): NotificationType {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid NotificationType value: $value")
        }
    }
}
