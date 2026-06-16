package com.ywllab.nemo.util

import cn.hutool.core.util.URLUtil
import org.springframework.http.HttpHeaders
import javax.servlet.http.HttpServletResponse

object HttpHeaderUtil {
    const val EXPORT_SUCCESS = "X-Export-Success"

    const val EXPORT_ERROR_MSG = "X-Export-Error-Msg"

    fun setExportHeader(response: HttpServletResponse, fileName: String) {
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + URLUtil.encode(fileName))
        response.setHeader(EXPORT_SUCCESS, "true")
    }

    fun setExportError(response: HttpServletResponse, message: String) {
        response.setHeader(EXPORT_SUCCESS, "false")
        response.setHeader(EXPORT_ERROR_MSG, URLUtil.encode(message))
    }
}
