package com.ywllab.nemo.util

import com.ywllab.nemo.store.ObjectStoreClient
import com.ywllab.nemo.store.ObjectStoreManager
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import javax.annotation.PostConstruct

@ConditionalOnProperty("app.oss.bucket")
@Component
open class OssClient {

    @Autowired
    lateinit var storeManager: ObjectStoreManager

    @Value("\${spring.profiles.active:}")
    lateinit var activeProfile: String

    @Value("\${app.oss.prefix:}")
    lateinit var prefix: String

    @Value("\${app.oss.bucket:}")
    lateinit var bucket: String

    @Value("\${app.oss.endpoint:}")
    lateinit var endpoint: String

    /**
     * Public network OSS client (for URLs returned to browsers)
     */
    lateinit var client: ObjectStoreClient

    /**
     * Internal network OSS client (for server-side downloads)
     */
    lateinit var internalClient: ObjectStoreClient

    @PostConstruct
    open fun initOssClient() {
        client = storeManager.createClient("app.oss", bucket)
        internalClient = storeManager.createInternalClient("app.oss", bucket)
    }

    open fun getKey(vararg paths: String): String {
        return "$prefix/$activeProfile/" + paths.joinToString("/")
    }

    open fun getHost(): String {
        return "https://$bucket.$endpoint/"
    }
}
