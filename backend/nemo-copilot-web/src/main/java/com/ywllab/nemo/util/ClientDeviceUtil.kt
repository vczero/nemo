package com.ywllab.nemo.util

object ClientDeviceUtil {

    fun deviceInfo(userAgent: String?): String? {
        if (userAgent.isNullOrBlank()) return null

        val os = when {
            userAgent.contains("Windows NT 10.0") -> "Windows 10"
            userAgent.contains("Windows NT 11.0") -> "Windows 11"
            userAgent.contains("Windows NT 6.1") -> "Windows 7"
            userAgent.contains("Windows NT 6.3") -> "Windows 8.1"
            userAgent.contains("Windows") -> "Windows"
            userAgent.contains("Mac OS X") -> {
                val match = Regex("Mac OS X ([0-9_]+)").find(userAgent)
                if (match != null) "macOS ${match.groupValues[1].replace("_", ".")}" else "macOS"
            }

            userAgent.contains("Android") -> {
                val match = Regex("Android ([0-9.]+)").find(userAgent)
                "Android ${match?.groupValues?.get(1) ?: ""}"
            }

            userAgent.contains("iPhone") -> "iPhone"
            userAgent.contains("iPad") -> "iPad"
            userAgent.contains("Linux") -> "Linux"
            else -> "Unknown"
        }

        val browser = when {
            userAgent.contains("Edg/") && userAgent.contains("EdgA/") -> "Edge"
            userAgent.contains("Edg/") -> "Edge"
            userAgent.contains("Chrome/") && !userAgent.contains("Edg/") -> "Chrome"
            userAgent.contains("Safari/") && userAgent.contains("Version/") -> "Safari"
            userAgent.contains("Safari/") && !userAgent.contains("Chrome/") -> "Safari"
            userAgent.contains("Firefox/") -> "Firefox"
            userAgent.contains("MicroMessenger") -> "WeChat"
            else -> "Unknown"
        }

        val device = when {
            userAgent.contains("iPhone") -> {
                val match = Regex("iPhone[0-9,]+").find(userAgent)
                "iPhone ${match?.value ?: ""}"
            }

            userAgent.contains("iPad") -> {
                val match = Regex("iPad[0-9,]+").find(userAgent)
                "iPad ${match?.value ?: ""}"
            }

            userAgent.contains("Android") -> {
                val match = Regex("; ([^)]+)\\)").find(userAgent)
                match?.groupValues?.get(1) ?: "Android"
            }

            else -> ""
        }

        return buildString {
            if (device.isNotEmpty()) append(device).append(" / ")
            append(os).append(" / ").append(browser)
        }
    }
}
