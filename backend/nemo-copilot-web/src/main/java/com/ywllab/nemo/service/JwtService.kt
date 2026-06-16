package com.ywllab.nemo.service

import cn.hutool.json.JSONUtil
import cn.hutool.jwt.JWTUtil
import cn.hutool.jwt.signers.JWTSigner
import cn.hutool.jwt.signers.JWTSignerUtil
import com.ywllab.nemo.dto.user.UserSession
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import javax.annotation.PostConstruct

/**
 * JWT token service for generating and verifying tokens.
 */
@Service
open class JwtService {

    private val log = LoggerFactory.getLogger(javaClass)

    @Value("\${app.jwt.secret:mcp-auth:test-mcp-secret-key}")
    private lateinit var jwtSecret: String

    @Value("\${app.jwt.expire-seconds:86400}")
    private var expireSeconds: Long = 86400

    private lateinit var signer: JWTSigner

    companion object {
        const val CLAIM_USER_ID = "userId"
        const val CLAIM_USERNAME = "username"
    }

    @PostConstruct
    fun init() {
        signer = JWTSignerUtil.createSigner("HS256", jwtSecret.toByteArray())
    }

    /**
     * Generate JWT token for user session.
     */
    open fun generateToken(userSession: UserSession): String {
        val now = System.currentTimeMillis() / 1000
        val payload = (
            JSONUtil.toBean(JSONUtil.toJsonStr(userSession), Map::class.java)
                .filter { it.value != null }.map { it.key to it.value }.toMap() as Map<String, Any>
            ).toMutableMap()
        payload["iat"] = now
        payload["exp"] = now + expireSeconds
        return JWTUtil.createToken(payload, signer)
    }

    /**
     * Generate JWT token from userId and username.
     */
    open fun generateToken(userId: String, username: String): String {
        val userSession = UserSession().apply {
            this.userId = userId
            this.username = username
        }
        return generateToken(userSession)
    }

    /**
     * Verify and parse JWT token.
     * @return payload map if valid, null if invalid
     */
    open fun verifyToken(token: String): Map<String, Any>? {
        return try {
            synchronized(this) {
                val jwt = JWTUtil.parseToken(token)
                if (!jwt.verify(signer)) {
                    log.warn("JWT verify failed - invalid signature, token: {}", token.take(50))
                    return null
                }
                if (jwt.validate(0)) {
                    log.warn("JWT verify failed - expired, token: {}", token.take(50))
                    return null
                }
                jwt.payloads
            }
        } catch (e: Exception) {
            log.warn("JWT verify failed - {}, token: {}", e.message, token.take(50))
            null
        }
    }

    /**
     * Extract userId from JWT token.
     */
    open fun getUserId(token: String): String? {
        return verifyToken(token)?.get(CLAIM_USER_ID)?.toString()
    }

    /**
     * Build UserSession from JWT payload.
     */
    open fun getUserSession(token: String): UserSession? {
        val payload = verifyToken(token) ?: return null
        return JSONUtil.toBean(JSONUtil.parseObj(payload), UserSession::class.java)
    }
}
