package com.ywllab.nemo.util

import cn.hutool.crypto.SecureUtil
import cn.hutool.crypto.symmetric.AES
import com.ywllab.nemo.exception.SystemException
import java.nio.charset.StandardCharsets
import java.util.Base64

/**
 * 加密解密工具类
 */
object CryptoUtil {

    /**
     * AES密钥，需与前端协商一致（16字节）
     */
    const val AES_SECRET_KEY = ""

    /**
     * AES加密器（ECB模式，PKCS5Padding填充）
     */
    val aes: AES = SecureUtil.aes(AES_SECRET_KEY.toByteArray(StandardCharsets.UTF_8))

    fun decrypt(encryptedBase64: String): String {
        return try {
            aes.decryptStr(encryptedBase64)
        } catch (e: Exception) {
            throw SystemException("非法数据:${e.message}")
        }
    }

    fun encrypt(password: String): String {
        val encrypted = aes.encrypt(password)
        return Base64.getEncoder().encodeToString(encrypted)
    }
}
