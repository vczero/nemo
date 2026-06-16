package com.ywllab.nemo.constant

/**
 * 计算服务状态枚举
 */
enum class ComputeEndpointStatus(val desc: String) {
    ACTIVE("启用"),
    INACTIVE("禁用");

    companion object {
        fun fromValue(value: String): ComputeEndpointStatus {
            return values().find { it.name == value }
                ?: throw IllegalArgumentException("Invalid ComputeEndpointStatus value: $value")
        }
    }
}
