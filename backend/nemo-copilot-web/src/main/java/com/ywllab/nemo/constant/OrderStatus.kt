package com.ywllab.nemo.constant

enum class OrderStatus(val status: String, val description: String) {
    UN_PAY("PENDING", "待支付"),
    PAID("PAID", "已支付"),
    CANCELLED("CANCELLED", "已取消"),
    REFUNDED("REFUNDED", "已退款")
}
