package com.ywllab.nemo.store

import cn.hutool.core.io.FileUtil
import com.aliyun.oss.ClientConfiguration
import com.aliyun.oss.OSSClient
import com.aliyun.oss.common.auth.DefaultCredentialProvider
import com.aliyun.oss.common.comm.Protocol
import com.aliyun.oss.internal.Mimetypes
import com.aliyun.oss.model.CannedAccessControlList
import com.aliyun.oss.model.DeleteObjectsRequest
import com.aliyun.oss.model.GeneratePresignedUrlRequest
import com.aliyun.oss.model.ListObjectsV2Request
import com.aliyun.oss.model.ObjectMetadata
import com.aliyun.oss.model.PutObjectRequest
import org.slf4j.LoggerFactory
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

open class AliyunOssClient(
    override val endpoint: String,
    override val bucket: String,
    accessKey: String,
    secretKey: String
) : ObjectStoreClient() {

    private val log = LoggerFactory.getLogger(this.javaClass)

    private val client: OSSClient

    init {
        val credentialProvider = DefaultCredentialProvider(accessKey, secretKey)
        val config = ClientConfiguration().also {
            it.protocol = Protocol.HTTPS
        }
        client = OSSClient(endpoint, credentialProvider, config)
    }

    override fun isConnected(): Boolean {
        return try {
            client.getBucketStat(bucket)
            return true
        } catch (e: Exception) {
            log.warn(e.message)
            false
        }
    }

    override fun put(key: String, data: ByteArray) {
        val stream = ByteArrayInputStream(data)
        put(key, stream)
    }

    override fun put(key: String, file: File) {
        client.putObject(bucket, key, file)
        var lastException: Exception? = null
        repeat(3) {
            try {
                client.setObjectAcl(bucket, key, CannedAccessControlList.PublicRead)
                return
            } catch (e: Exception) {
                // 并发修改对象元数据会报错 "File is stale for this operation"
                log.warn(e.message)
                lastException = e
                Thread.sleep(it * 300L)
            }
        }
        log.error(lastException?.message)
    }

    override fun put(key: String, stream: InputStream) {
        this.put(key, stream, CannedAccessControlList.PublicRead)
    }

    open fun put(key: String, stream: InputStream, cannedACL: CannedAccessControlList) {
        val putObjectRequest = PutObjectRequest(bucket, key, stream)
        val meta = ObjectMetadata()
        meta.setObjectAcl(cannedACL)
        meta.contentDisposition = buildContentDisposition(key)
        meta.contentType = Mimetypes.getInstance().getMimetype(key)
        client.putObject(putObjectRequest)
    }

    // 内链文件类型,浏览器预览时直接打开,无需下载
    private var inlineExtensions: Set<String> = HashSet(
        mutableListOf(
            "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "pdf", "mp4", "webm",
            "mp3", "wav", "txt", "md", "json", "xml", "html"
        )
    )

    private fun buildContentDisposition(originalFilename: String): String {
        val extension = FileUtil.extName(originalFilename).lowercase(Locale.getDefault())
        val disposition = if (inlineExtensions.contains(extension)) "inline" else "attachment"
        val encodeFileName = URLEncoder.encode(originalFilename, StandardCharsets.UTF_8.toString())
        val contentDisposition = String.format("%s; filename*=UTF-8''%s", disposition, encodeFileName)
        return contentDisposition
    }

    override fun get(key: String): InputStream {
        return client.getObject(bucket, key).objectContent
    }

    override fun getPublicUrl(key: String): String {
        return "https://$bucket.$endpoint/$key"
    }

    override fun getPublicHttpUrl(key: String): String {
        return "http://$bucket.$endpoint/$key"
    }

    override fun remove(key: String) {
        client.deleteObject(bucket, key)
    }

    override fun listObjects(prefix: String): List<OssObjectDto> {
        val objectList = mutableListOf<OssObjectDto>()
        var continuationToken: String? = null
        do {
            val request = ListObjectsV2Request().apply {
                this.bucketName = bucket
                this.prefix = prefix
                this.continuationToken = continuationToken
                this.maxKeys = 1000
            }
            val result = client.listObjectsV2(request)
            if (result.objectSummaries.isNotEmpty()) {
                objectList += result.objectSummaries.map {
                    OssObjectDto().apply {
                        this.key = it.key
                        this.size = it.size
                        this.lastModified = it.lastModified
                    }
                }
            }
            continuationToken = result.nextContinuationToken
        } while (result.isTruncated)
        return objectList
    }

    override fun deleteObjects(keys: List<String>): List<String> {
        val deleteObjectsRequest = DeleteObjectsRequest(bucket).withKeys(keys)
        return client.deleteObjects(deleteObjectsRequest).deletedObjects
    }

    override fun getObjectMetadata(key: String): OssObjectDto {
        val objectMetadata = client.getObjectMetadata(bucket, key)
        return OssObjectDto().apply {
            this.key = key
            this.size = objectMetadata.contentLength
            this.lastModified = objectMetadata.lastModified
        }
    }

    override fun isExist(key: String): Boolean {
        return client.doesObjectExist(bucket, key)
    }

    override fun generatePresignedUrl(key: String, timeout: Long, unit: TimeUnit, process: String?): String {
        val millis = unit.toMillis(timeout)
        val expiration = Date(System.currentTimeMillis() + millis)
        val req = GeneratePresignedUrlRequest(bucket, key).also {
            it.expiration = expiration
            it.process = process
        }
        val url = client.generatePresignedUrl(req)
        return url.toString()
    }
}
