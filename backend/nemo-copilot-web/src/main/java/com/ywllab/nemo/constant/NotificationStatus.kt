package com.ywllab.nemo.constant

enum class NotificationStatus(var desc: String) {
    UNREAD("未读"),
    READ("已读"),
    DELETED("已删除");

    companion object {
        fun fromValue(value: String): NotificationStatus {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid NotificationStatus value: $value")
        }
    }
}
