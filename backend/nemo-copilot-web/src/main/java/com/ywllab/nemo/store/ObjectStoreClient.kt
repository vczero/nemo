package com.ywllab.nemo.store

import java.io.File
import java.io.InputStream
import java.util.concurrent.TimeUnit

abstract class ObjectStoreClient {

    protected val OBJECT_SIZE_LIMIT = 1073741824L

    abstract val endpoint: String
    abstract val bucket: String

    /**
     * 客户端是否已连接成功
     */
    abstract fun isConnected(): Boolean

    /**
     * 保存一个对象
     */
    abstract fun put(key: String, data: ByteArray)

    /**
     * 保存一个对象
     */
    abstract fun put(key: String, stream: InputStream)

    /**
     * 保存一个对象
     */
    abstract fun put(key: String, file: File)

    /**
     * 读取一个对象
     */
    abstract fun get(key: String): InputStream

    /**
     * 获取一个对象永久的公开访问的 URL
     */
    abstract fun getPublicUrl(key: String): String

    abstract fun getPublicHttpUrl(key: String): String

    abstract fun generatePresignedUrl(key: String, timeout: Long, unit: TimeUnit, process: String? = null): String

    /**
     * 删除一个对象
     */
    abstract fun remove(key: String)

    /**
     * 根据前缀列出所有对象
     */
    abstract fun listObjects(prefix: String): List<OssObjectDto>

    /**
     * 批量删除对象
     */
    abstract fun deleteObjects(keys: List<String>): List<String>

    /**
     * 获取一个对象的元信息
     */
    abstract fun getObjectMetadata(key: String): OssObjectDto

    /**
     * 判断对象是否存在
     */
    abstract fun isExist(key: String): Boolean
}
