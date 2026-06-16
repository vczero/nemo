package com.ywllab.nemo.util

import javax.servlet.http.HttpServletRequest

object ClientIpUtil {

    // 定义可能的IP头字段列表
    private val CLIENT_IP_HEADERS = setOf(
        "X-Original-Forwarded-For",
        "X-Forwarded-For",
        "Proxy-Client-IP",
        "WL-Proxy-Client-IP",
        "HTTP_CLIENT_IP",
        "HTTP_X_FORWARDED_FOR",
        "X-Real-IP"
    )

    /**
     * 获取客户端的真实IP地址
     *
     * @param request HttpServletRequest 对象
     * @return 客户端的真实IP地址
     */
    fun getClientIp(request: HttpServletRequest): String {
        // 遍历头字段列表，找到第一个有效的IP
        val ip = CLIENT_IP_HEADERS
            .asSequence()
            .mapNotNull { request.getHeader(it) }
            .firstOrNull { it.isValidIp() }

        // 如果未找到有效IP，则使用 remoteAddr
        return ip?.takeUnless { it.contains(",") }?.substringBefore(",") ?: request.remoteAddr
    }

    /**
     * 判断IP地址是否有效
     *
     * @return 如果IP地址为null、空字符串或"unknown"，则返回false；否则返回true
     */
    private fun String?.isValidIp(): Boolean {
        return !this.isNullOrEmpty() && !"unknown".equals(this, ignoreCase = true)
    }
}
