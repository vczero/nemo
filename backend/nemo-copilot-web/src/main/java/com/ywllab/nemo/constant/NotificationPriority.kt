package com.ywllab.nemo.constant

enum class NotificationPriority(var desc: String, var level: Int) {
    NORMAL("普通", 1),
    IMPORTANT("重要", 2),
    URGENT("紧急", 3);

    companion object {
        fun fromValue(value: String): NotificationPriority {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid NotificationPriority value: $value")
        }
    }
}
