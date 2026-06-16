package com.ywllab.nemo.constant

enum class SubscriptionStatus(val status: String, val description: String) {
    ACTIVE("ACTIVE", "激活"),
    EXPIRED("EXPIRED", "过期"),
    NONE("NONE", "无订阅")
}
