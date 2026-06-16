package com.ywllab.nemo.store

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.core.env.Environment

@Primary
@Configuration
open class ObjectStoreManager {

    @Autowired
    lateinit var env: Environment

    /**
     * Creates an OSS client using the specified endpoint (public by default).
     */
    fun createClient(prefix: String, bucket: String): ObjectStoreClient {
        val type = env.getRequiredProperty("$prefix.type")
        val endpoint = env.getRequiredProperty("$prefix.endpoint")
        val accessKey = env.getRequiredProperty("$prefix.access-key")
        val secretKey = env.getRequiredProperty("$prefix.secret-key")
        return createAliyunClient(type, endpoint, bucket, accessKey, secretKey)
    }

    /**
     * Creates an OSS client for internal network access.
     * Falls back to public endpoint if endpoint-internal is not configured.
     */
    fun createInternalClient(prefix: String, bucket: String): ObjectStoreClient {
        val type = env.getRequiredProperty("$prefix.type")
        val endpoint = env.getProperty("$prefix.endpoint-internal")
            ?: env.getRequiredProperty("$prefix.endpoint")
        val accessKey = env.getRequiredProperty("$prefix.access-key")
        val secretKey = env.getRequiredProperty("$prefix.secret-key")
        return createAliyunClient(type, endpoint, bucket, accessKey, secretKey)
    }

    private fun createAliyunClient(
        type: String,
        endpoint: String,
        bucket: String,
        accessKey: String,
        secretKey: String
    ): ObjectStoreClient {
        return when (type.lowercase()) {
            "aliyun" -> AliyunOssClient(endpoint, bucket, accessKey, secretKey)
            else -> throw Exception("Unknown object store type")
        }
    }
}
