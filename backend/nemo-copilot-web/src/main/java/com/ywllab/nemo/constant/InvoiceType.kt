package com.ywllab.nemo.constant

/**
 * 发票类型
 */
enum class InvoiceType(val description: String) {
    ENTERPRISE("企业"),
    PERSONAL("个人")
}

/**
 * 发票状态
 */
enum class InvoiceStatus(val description: String) {
    PENDING("待开具"),
    PROCESSING("开具中"),
    ISSUED("已开具")
}
