package com.ywllab.nemo.util

import com.ywllab.nemo.exception.ParamException
import com.ywllab.nemo.exception.SystemException
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.Request
import okhttp3.RequestBody
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream

@Component
open class SvgPdfUtil {
    @Value("\${app.toolbox.svg-to-pdf.url:}")
    lateinit var svgToPdfUrl: String

    private companion object {
        const val MAX_FILE_SIZE = 10 * 1024 * 1024L
    }

    fun convertSvgToPdf(svgFile: MultipartFile): InputStream {
        if (svgFile.isEmpty) {
            throw ParamException("文件不能为空")
        }

        if (svgFile.size > MAX_FILE_SIZE) {
            throw ParamException("文件大小不能超过10MB")
        }

        val originalFilename = svgFile.originalFilename ?: "upload.svg"
        val lastDot = originalFilename.lastIndexOf('.')
        val extension = if (lastDot > 0) originalFilename.substring(lastDot + 1).lowercase() else ""

        if (extension != "svg") {
            throw ParamException("只支持SVG文件")
        }
        return callRemoteService(svgFile)
    }

    protected val client = HttpUtil.okhttpClient

    private fun callRemoteService(svgFile: MultipartFile): InputStream {
        val multipart = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "file", svgFile.originalFilename,
                RequestBody.create(
                    MediaType.parse("application/octet-stream"),
                    svgFile.bytes
                )
            )
            .build()
        val request = Request.Builder()
            .url(svgToPdfUrl)
            .post(multipart)
            .build()
        val res = client.newCall(request).execute()
        return res.body()?.byteStream() ?: throw SystemException("响应体为空")
    }
}
