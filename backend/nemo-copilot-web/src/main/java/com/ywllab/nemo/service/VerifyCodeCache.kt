package com.ywllab.nemo.service

import cn.hutool.crypto.digest.BCrypt
import com.google.common.cache.Cache
import com.google.common.cache.CacheBuilder
import com.ywllab.nemo.constant.VerificationCodeType
import com.ywllab.nemo.exception.BizException
import org.slf4j.LoggerFactory
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component
import java.time.LocalDateTime
import java.util.concurrent.TimeUnit

@Component
class VerifyCodeCache(
    private val environment: Environment
) {
    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * 判断是否为生产环境
     */
    private fun isProd(): Boolean {
        return environment.activeProfiles.contains("prod")
    }

    /**
     * 调试模式验证码：非生产环境下，以202602开头的验证码直接通过
     */
    private fun isDebugCode(code: String): Boolean {
        return !isProd() && code.startsWith("202602")
    }

    data class VerifyCodeData(
        val code: String,
        val type: VerificationCodeType,
        val createTime: LocalDateTime,
        var isVerified: Boolean = false
    )

    private val cache: Cache<String, VerifyCodeData> = CacheBuilder.newBuilder()
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .maximumSize(1000)
        .build()

    private fun generateKey(email: String, type: VerificationCodeType): String {
        return "${type.name}:$email"
    }

    fun saveCode(email: String, code: String, type: VerificationCodeType) {
        val key = generateKey(email, type)
        val data = VerifyCodeData(
            code = code,
            type = type,
            createTime = LocalDateTime.now(),
            isVerified = false
        )
        cache.put(key, data)
    }

    fun verifyAndConsume(email: String, code: String, type: VerificationCodeType): Boolean {
        // 调试模式：非生产环境下，202602开头的验证码直接通过
        if (isDebugCode(code)) {
            log.info("调试模式验证码通过验证，email: $email, type: $type, code: $code")
            return true
        }

        val key = generateKey(email, type)
        val data = cache.getIfPresent(key)
            ?: throw BizException("验证码无效")

        val expiryTime = data.createTime.plusMinutes(10)
        if (LocalDateTime.now().isAfter(expiryTime)) {
            cache.invalidate(key)
            throw BizException("验证码已过期")
        }

        if (!BCrypt.checkpw(code, data.code)) {
            throw BizException("验证码无效")
        }

        cache.invalidate(key)
        return true
    }

    fun verifyAndMark(email: String, code: String, type: VerificationCodeType): Boolean {
        // 调试模式：非生产环境下，202602开头的验证码直接通过
        if (isDebugCode(code)) {
            log.info("调试模式验证码通过验证，email: $email, type: $type, code: $code")
            return true
        }

        val key = generateKey(email, type)
        val data = cache.getIfPresent(key)
            ?: throw BizException("验证码无效")

        val expiryTime = data.createTime.plusMinutes(10)
        if (LocalDateTime.now().isAfter(expiryTime)) {
            cache.invalidate(key)
            throw BizException("验证码已过期")
        }

        if (!BCrypt.checkpw(code, data.code)) {
            throw BizException("验证码无效")
        }

        data.isVerified = true
        cache.put(key, data)
        return true
    }

    fun isVerified(email: String, type: VerificationCodeType): Boolean {
        val key = generateKey(email, type)
        val data = cache.getIfPresent(key)
        if (data == null) {
            log.info("验证码无效，email: $email, type: $type")
            throw BizException("验证码无效")
        }
        val expiryTime = data.createTime.plusMinutes(10)
        if (LocalDateTime.now().isAfter(expiryTime)) {
            cache.invalidate(key)
            log.info("验证码已过期，email: $email, type: $type")
            throw BizException("验证码已过期")
        }
        return data.isVerified
    }

    fun clearCode(email: String, type: VerificationCodeType) {
        val key = generateKey(email, type)
        cache.invalidate(key)
    }

    fun clearAll() {
        cache.invalidateAll()
    }
}
