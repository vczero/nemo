package com.ywllab.nemo.service

import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.store.AliyunOssClient
import com.ywllab.nemo.exception.ParamException
import com.ywllab.nemo.exception.SystemException
import com.ywllab.nemo.util.OssClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.Base64.getEncoder
import java.util.Date
import java.util.Locale
import java.util.UUID
import java.util.concurrent.TimeUnit

@Service
open class OssService(
    private val ossClient: OssClient
) {
    private val log = LoggerFactory.getLogger(OssService::class.java)

    private val dateFormat = SimpleDateFormat("yyyy/MM/dd")

    /**
     * 内联显示的文件扩展名（浏览器可以直接预览）
     */
    private val inlineExtensions = setOf(
        "html", "htm", "pdf", "jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"
    )

    open fun getPublicUrl(key: String): String {
        val objectPath = if (key.startsWith("/")) key.substring(1) else key
        return ossClient.client.getPublicUrl(objectPath)
    }

    open fun getFileSize(ossPath: String): Long {
        val objectPath = if (ossPath.startsWith("/")) ossPath.substring(1) else ossPath
        return ossClient.internalClient.getObjectMetadata(objectPath).size
    }

    open fun generatePresignedUrl(
        key: String,
        timeout: Long = 600_000,
        unit: TimeUnit = TimeUnit.SECONDS,
        process: String? = null
    ): String {
        val objectPath = if (key.startsWith("/")) key.substring(1) else key
        return ossClient.client.generatePresignedUrl(objectPath, timeout, unit, process)
    }

    open fun uploadFile(type: FileType, file: MultipartFile, userId: String): Pair<String, Long> {
        if (file.isEmpty) {
            throw ParamException("文件不能为空")
        }

        val originalFilename = file.originalFilename ?: "unknown"
        val extension = getFileExtension(originalFilename)
        val fileName = "${UUID.randomUUID()}.$extension"
        val datePath = dateFormat.format(Date())
        val objectPath = ossClient.getKey(type.name, userId, datePath, fileName)

        try {
            file.inputStream.use { inputStream ->
                uploadWithDisposition(objectPath, inputStream)
            }
            log.info("File uploaded to OSS, userId={}, file={}, size={}", userId, originalFilename, file.size)
            return Pair(objectPath, file.size)
        } catch (e: Exception) {
            log.error("Failed to upload file to OSS", e)
            throw SystemException(e.message)
        }
    }

    /**
     * 删除OSS文件
     */
    open fun deleteFile(ossPath: String) {
        try {
            val objectPath = if (ossPath.startsWith("/")) ossPath.substring(1) else ossPath
            ossClient.client.remove(objectPath)
            log.info("File deleted from OSS, path={}", ossPath)
        } catch (e: Exception) {
            log.warn("Failed to delete file from OSS, path={}", ossPath, e)
        }
    }

    /**
     * 从OSS下载文件内容
     * @param ossPath OSS路径
     * @param internal 是否使用内网下载，默认false（公网）
     * @return 文件内容（Base64编码的字符串）
     */
    open fun downloadFileContent(ossPath: String, internal: Boolean = false): String? {
        val objectPath = if (ossPath.startsWith("/")) ossPath.substring(1) else ossPath
        val client = if (internal) ossClient.internalClient else ossClient.client
        try {
            return client.get(objectPath).use { inputStream ->
                inputStream.readBytes()
            }.let { bytes ->
                getEncoder().encodeToString(bytes)
            }
        } catch (e: Exception) {
            log.warn("Failed to download file from OSS, path={}, internal={}", ossPath, internal, e)
            return null
        }
    }

    /**
     * 从OSS下载文件内容
     * @param ossPath OSS路径
     * @param internal 是否使用内网下载，默认false（公网）
     * @return 文件内容（字节数组）
     */
    open fun downloadFile(ossPath: String, internal: Boolean = false): ByteArray? {
        val objectPath = if (ossPath.startsWith("/")) ossPath.substring(1) else ossPath
        val client = if (internal) ossClient.internalClient else ossClient.client
        try {
            return client.get(objectPath).use { inputStream ->
                inputStream.readBytes()
            }
        } catch (e: Exception) {
            log.warn("Failed to download file from OSS, path={}, internal={}", ossPath, internal, e)
            return null
        }
    }

    /**
     * 上传字节数组到OSS
     * @param type 文件类型
     * @param bytes 字节数组
     * @param fileName 文件名
     * @param userId 用户ID
     * @return Pair<OSS路径, 文件大小>
     */
    open fun uploadBytes(type: FileType, bytes: ByteArray, fileName: String, userId: String): Pair<String, Long> {
        val datePath = dateFormat.format(Date())
        val objectPath = ossClient.getKey(type.name, userId, datePath, fileName)
        try {
            ByteArrayInputStream(bytes).use { inputStream ->
                uploadWithDisposition(objectPath, inputStream)
            }
            log.info("Bytes uploaded to OSS, userId={}, fileName={}, size={}", userId, fileName, bytes.size)
            return Pair(objectPath, bytes.size.toLong())
        } catch (e: Exception) {
            log.error("Failed to upload bytes to OSS", e)
            throw SystemException(e.message)
        }
    }

    /**
     * 上传HTML内容到OSS（公网可访问）
     * @param content HTML内容
     * @param userId 用户ID
     * @return OSS路径
     */
    open fun uploadHtmlContent(content: String, userId: String): String {
        val fileName = "agreement-${UUID.randomUUID()}.html"
        val datePath = dateFormat.format(Date())
        val objectPath = ossClient.getKey("AGREEMENT", userId, datePath, fileName)
        try {
            val bytes = content.toByteArray(Charsets.UTF_8)
            ByteArrayInputStream(bytes).use { inputStream ->
                uploadWithDisposition(objectPath, inputStream)
            }
            log.info("HTML content uploaded to OSS, userId={}, size={}", userId, bytes.size)
            return "/$objectPath"
        } catch (e: Exception) {
            log.error("Failed to upload HTML content to OSS", e)
            throw SystemException(e.message)
        }
    }

    /**
     * 上传文件并设置为公共读权限
     */
    private fun uploadWithDisposition(objectPath: String, inputStream: InputStream) {
        // 转换为 AliyunClient 以设置 ACL
        val aliyunClient = ossClient.client as? AliyunOssClient
            ?: throw SystemException("OSS client type error")
        aliyunClient.put(objectPath, inputStream)
    }

    /**
     * 获取文件扩展名
     */
    private fun getFileExtension(filename: String): String {
        val lastDot = filename.lastIndexOf('.')
        return if (lastDot > 0) {
            filename.substring(lastDot + 1).lowercase(Locale.getDefault())
        } else {
            ""
        }
    }

    /**
     * 检查OSS文件是否存在
     * @param objectPath OSS对象路径
     * @return 是否存在
     */
    open fun fileExists(objectPath: String): Boolean {
        val path = if (objectPath.startsWith("/")) objectPath.substring(1) else objectPath
        return try {
            val client = ossClient.client
            client.getObjectMetadata(path)
            true
        } catch (e: com.aliyun.oss.ServiceException) {
            if (e.errorCode == "NoSuchKey") false
            else throw e
        }
    }
}
