package com.ywllab.nemo.service

import com.google.common.cache.Cache
import com.google.common.cache.CacheBuilder
import org.springframework.stereotype.Component
import java.util.concurrent.TimeUnit

@Component
class RateLimitCache {

    private val sendTimeCache: Cache<String, Long>
    private val emailCountCache: Cache<String, Int>
    private val ipCountCache: Cache<String, Int>

    init {
        // fixme 6s内只能发送1次,debug 1s
        sendTimeCache = CacheBuilder.newBuilder()
            .expireAfterWrite(1, TimeUnit.SECONDS)
            .maximumSize(10000)
            .build()

        emailCountCache = CacheBuilder.newBuilder()
            .expireAfterWrite(24, TimeUnit.HOURS)
            .maximumSize(10000)
            .build()

        ipCountCache = CacheBuilder.newBuilder()
            .expireAfterWrite(24, TimeUnit.HOURS)
            .maximumSize(10000)
            .build()
    }

    fun checkSendInterval(email: String): Boolean {
        val key = "send_time:$email"
        val lastSendTime = sendTimeCache.getIfPresent(key)
        if (lastSendTime != null) {
            return false
        }
        val now = System.currentTimeMillis()
        sendTimeCache.put(key, now)
        return true
    }

    fun incrementEmailCount(email: String): Int {
        val key = "email_count:$email"
        val count = emailCountCache.getIfPresent(key) ?: 0
        val newCount = count + 1
        emailCountCache.put(key, newCount)
        return newCount
    }

    fun getEmailCount(email: String): Int {
        val key = "email_count:$email"
        return emailCountCache.getIfPresent(key) ?: 0
    }

    fun incrementIpCount(ip: String): Int {
        val key = "ip_count:$ip"
        val count = ipCountCache.getIfPresent(key) ?: 0
        val newCount = count + 1
        ipCountCache.put(key, newCount)
        return newCount
    }

    fun getIpCount(ip: String): Int {
        val key = "ip_count:$ip"
        return ipCountCache.getIfPresent(key) ?: 0
    }

    fun clearAll() {
        sendTimeCache.invalidateAll()
        emailCountCache.invalidateAll()
        ipCountCache.invalidateAll()
    }
}
