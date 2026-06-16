package com.ywllab.nemo.service

import cn.hutool.jwt.signers.JWTSignerUtil
import com.ywllab.nemo.dto.user.UserSession
import org.junit.Assert
import org.junit.Test

class JwtServiceTest {
    val secret = ""

    private fun createJwtService(secret: String): JwtService {
        val jwtService = JwtService()
        val field = JwtService::class.java.getDeclaredField("signer")
        field.isAccessible = true
        val signer = JWTSignerUtil.createSigner("HS256", secret.toByteArray())
        field.set(jwtService, signer)
        return jwtService
    }

    @Test
    fun generateAndVerify() {
        val jwtService = createJwtService(secret)
        val token = jwtService.generateToken("2054020182354898944", "xxx")
        Assert.assertNotNull(token)
        Assert.assertTrue(token.isNotBlank())
        println(token)

        val payload = jwtService.verifyToken(token)
        Assert.assertNotNull(payload)
        Assert.assertEquals("2054020182354898944", payload!![JwtService.CLAIM_USER_ID])
        Assert.assertEquals("nemo", payload[JwtService.CLAIM_USERNAME])
    }

    @Test
    fun generateAndVerifyWithUserSession() {
        val jwtService = createJwtService(secret)
        val userSession = UserSession().apply {
            userId = "2015709046363910144"
            username = "nemo"
            nickname = "Nemo User"
            email = "nemo@example.com"
            avatarUrl = "https://example.com/avatar.jpg"
            organization = "Test Org"
        }

        val token = jwtService.generateToken(userSession)
        Assert.assertNotNull(token)
        Assert.assertTrue(token.isNotBlank())

        val parsedSession = jwtService.getUserSession(token)
        Assert.assertNotNull(parsedSession)
        Assert.assertEquals("2015709046363910144", parsedSession!!.userId)
        Assert.assertEquals("nemo", parsedSession.username)
        Assert.assertEquals("Nemo User", parsedSession.nickname)
        Assert.assertEquals("nemo@example.com", parsedSession.email)
        Assert.assertEquals("https://example.com/avatar.jpg", parsedSession.avatarUrl)
        Assert.assertEquals("Test Org", parsedSession.organization)
    }

    @Test
    fun verifyPass() {
        val jwtService = createJwtService(secret)
        val token =
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIyMDU0MDIwMTgyMzU0ODk4OTQ0IiwidXNlcm5hbWUiOiJnZW9zbWF" +
                "ydCIsImdsb2JhbEF1dGhMaXN0IjpbXSwiaWF0IjoxNzc5NTI2MjEwLCJleHAiOjE4NjU5MjYyMTB9.E5Ir1uZFVU9hZuuT0Re74" +
                "S25t8hHD3eSvfuQ92u9gWI"
        val payload = jwtService.verifyToken(token)
        Assert.assertNotNull(payload)
    }

    @Test
    fun verifyTokenWithWrongSecret() {
        val jwtService = createJwtService("secret-a")
        val token = jwtService.generateToken("user123", "testuser")

        val jwtService2 = createJwtService("secret-b")
        val payload = jwtService2.verifyToken(token)
        Assert.assertNull(payload)
    }

    @Test
    fun getUserId() {
        val jwtService = createJwtService(secret)
        val token = jwtService.generateToken("user456", "anotheruser")
        Assert.assertEquals("user456", jwtService.getUserId(token))
    }
}
