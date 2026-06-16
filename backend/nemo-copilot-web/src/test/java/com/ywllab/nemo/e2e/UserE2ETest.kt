package com.ywllab.nemo.e2e

import cn.hutool.http.HttpUtil
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import com.ywllab.nemo.constant.VerificationCodeType
import com.ywllab.nemo.util.CryptoUtil.encrypt
import org.junit.Assert
import org.junit.Test
import java.io.FileOutputStream

/***
 * 使用hutool的HttpUtil来发送请求
 * 测试场景
 * 1. 注册流程：发送验证码，验证验证码，注册用户
 * 2. 登录流程：使用用户名/邮箱+密码登录
 * 3. 登录流程：使用用户名/邮箱+邮箱验证码登录
 * 4. 修改密码流程：使用旧密码修改密码
 * 5. 修改密码流程：使用验证码修改密码
 */
class UserE2ETest : BaseTest() {

    companion object {
        private var testUserEmail: String = "nemo@deepcoord.com"
        private var testUsername: String = "nemo"
        private var testPassword: String = "123456"
        private var testUserId: String = "2015709046363910144"
        private var testVerifyCode: String = "202602"
    }

    @Test
    fun `register flow with verification code`() {
        val testUserEmail = "xxx@foxmail.com"
        println("\n=== Test 1: Register Flow ===")
        val sendCodeResponse = HttpUtil.post(
            "$baseUrl/api/email/send-register-code",
            JSONObject().apply {
                put("email", testUserEmail)
                put("type", VerificationCodeType.REGISTER)
            }.toJSONString()
        )

        println("Send Code Response: $sendCodeResponse")
        val sendCodeJson = JSON.parseObject(sendCodeResponse)
        Assert.assertTrue("发送验证码失败", sendCodeJson.getBoolean("success") == true)

        val verifyCodeResponse = HttpUtil.post(
            "$baseUrl/api/email/verify-code",
            JSONObject().apply {
                put("email", testUserEmail)
                put("type", "REGISTER")
                put("code", testVerifyCode)
            }.toJSONString()
        )

        println("Verify Code Response: $verifyCodeResponse")
        val verifyCodeJson = JSON.parseObject(verifyCodeResponse)
        Assert.assertTrue("验证验证码失败", verifyCodeJson.getBoolean("success") == true)

        val registerResponse = HttpUtil.post(
            "$baseUrl/api/user/register-by-email",
            JSONObject().apply {
                put("username", testUsername)
                put("password", encrypt(testPassword))
                put("email", testUserEmail)
                put("verifyCode", testVerifyCode)
                put("nickname", "E2EUser")
                put("inviteCode", "XQEBIPC1MK")
                put("agreementIds", listOf("2017920917992558592", "2017920917992558593", "2017920917992558594"))
            }.toJSONString()
        )

        println("Register Response: $registerResponse")
        val registerJson = JSON.parseObject(registerResponse)
        Assert.assertTrue("注册用户失败", registerJson.getBoolean("success") == true)
        println("✓ Register flow completed successfully with userId: $testUserId")
    }

    @Test
    fun `login with password`() {
        println("\n=== Test 2: Login with Password ===")

        val response = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", testUsername)
                put("password", encrypt(testPassword))
            }.toJSONString()
        )

        println("Login Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("登录失败", jsonResponse.getBoolean("success") == true)

        println("✓ Login with password successful")
    }

    @Test
    fun `login with email verification code`() {
        println("\n=== Test 3: Login with Email Verification Code ===")

        val sendCodeResponse = HttpUtil.post(
            "$baseUrl/api/email/send-register-code",
            JSONObject().apply {
                put("email", testUserEmail)
                put("type", VerificationCodeType.LOGIN)
            }.toJSONString()
        )

        println("Send Code Response: $sendCodeResponse")
        val sendCodeJson = JSON.parseObject(sendCodeResponse)
        Assert.assertTrue("发送验证码失败", sendCodeJson.getBoolean("success") == true)

        val loginResponse = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", testUserEmail)
                put("verifyCode", testVerifyCode)
            }.toJSONString()
        )

        println("Login Response: $loginResponse")
        val loginJson = JSON.parseObject(loginResponse)
        Assert.assertTrue("验证码登录失败", loginJson.getBoolean("success") == true)

        println("✓ Login with email verification code successful")
    }

    @Test
    fun `change password with old password`() {
        println("\n=== Test 4: Change Password with Old Password ===")

        val newPassword = "123456"

        val response = HttpUtil.post(
            "$baseUrl/api/user/change-password-by-password",
            JSONObject().apply {
                put("userId", testUserId)
                put("oldPassword", encrypt("654321"))
                put("newPassword", encrypt(newPassword))
            }.toJSONString()
        )

        println("Change Password Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("修改密码失败", jsonResponse.getBoolean("success") == true)

        testPassword = newPassword

        println("✓ Password changed with old password successful")

        println("Verify: Login with new password")
        val loginResponse = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", testUsername)
                put("password", encrypt(newPassword))
            }.toJSONString()
        )

        val loginJson = JSON.parseObject(loginResponse)
        Assert.assertTrue("新密码登录失败", loginJson.getBoolean("success") == true)
        println("✓ Verified: New password works")
    }

    @Test
    fun `change password with verification code`() {
        val verifyCodeResponse = HttpUtil.post(
            "$baseUrl/api/email/verify-code",
            JSONObject().apply {
                put("email", testUserEmail)
                put("code", testVerifyCode)
                put("type", "RESET_PASSWORD")
            }.toJSONString()
        )

        println("Verify Code Response: $verifyCodeResponse")
        val verifyCodeJson = JSON.parseObject(verifyCodeResponse)
        Assert.assertTrue("验证验证码失败", verifyCodeJson.getBoolean("success") == true)

        TEST_PASSWORD = "123456"
        val changePasswordResponse = HttpUtil.post(
            "$baseUrl/api/user/change-password-by-code",
            JSONObject().apply {
                put("email", testUserEmail)
                put("verifyCode", testVerifyCode)
                put("newPassword", encrypt(TEST_PASSWORD))
            }.toJSONString()
        )

        println("Change Password Response: $changePasswordResponse")
        val changePasswordJson = JSON.parseObject(changePasswordResponse)
        Assert.assertTrue("使用验证码修改密码失败", changePasswordJson.getBoolean("success") == true)

        println("✓ Password changed with verification code successful")

        println("Verify: Login with new password")
        val loginResponse = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", testUsername)
                put("password", encrypt(TEST_PASSWORD))
            }.toJSONString()
        )

        val loginJson = JSON.parseObject(loginResponse)
        Assert.assertTrue("新密码登录失败", loginJson.getBoolean("success") == true)
        println("✓ Verified: New password works")
    }

    @Test
    fun bad_email() {
        val sendCodeResponse = HttpUtil.post(
            "$baseUrl/api/email/send-register-code",
            JSONObject().apply {
                put("email", "sdds@ss.com")
                put("type", VerificationCodeType.LOGIN)
            }.toJSONString()
        )
        Assert.assertTrue(
            "使用验证码修改密码失败",
            JSON.parseObject(sendCodeResponse).getBoolean("success") == false
        )
    }

    @Test
    fun `update avatar with valid image`() {
        println("\n=== Test 6: Update Avatar with Valid Image ===")

        // 先登录获取session
        val loginResponse = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", testUsername)
                put("password", encrypt(testPassword))
            }.toJSONString()
        )

        println("Login Response: $loginResponse")
        val loginJson = JSON.parseObject(loginResponse)
        Assert.assertTrue("登录失败", loginJson.getBoolean("success") == true)
        val tempFile = java.io.File.createTempFile("official", ".png")
        val fos = FileOutputStream(tempFile)
        HttpUtil.download("https://modao.cc/images/official.png", fos, true)
        try {
            val response = cn.hutool.http.HttpRequest.post("$baseUrl/api/user/update-avatar")
                .form("file", tempFile)
                .execute()

            println("Update Avatar Response: ${response.body()}")
            val jsonResponse = JSON.parseObject(response.body())
            Assert.assertTrue("更新头像失败", jsonResponse.getBoolean("success") == true)

            println("✓ Avatar updated successfully")
        } finally {
            tempFile.delete()
        }
    }

    @Test
    fun `update avatar with invalid file type`() {
        println("\n=== Test 7: Update Avatar with Invalid File Type ===")

        // 先登录获取session
        val loginResponse = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", testUsername)
                put("password", encrypt(testPassword))
            }.toJSONString()
        )

        println("Login Response: $loginResponse")
        val loginJson = JSON.parseObject(loginResponse)
        Assert.assertTrue("登录失败", loginJson.getBoolean("success") == true)

        // 创建一个非图片文件（txt文件）
        val tempFile = java.io.File.createTempFile("test_avatar", ".txt")
        tempFile.writeText("This is not an image")

        try {
            val response = cn.hutool.http.HttpRequest.post("$baseUrl/api/user/update-avatar")
                .form("file", tempFile)
                .execute()

            println("Update Avatar Response: ${response.body()}")
            val jsonResponse = JSON.parseObject(response.body())
            Assert.assertTrue("应该返回错误", jsonResponse.getBoolean("success") == false)
            Assert.assertTrue(
                "错误信息应包含文件类型提示",
                jsonResponse.getString("message")?.contains("文件类型") == true
            )

            println("✓ Invalid file type rejected as expected")
        } finally {
            tempFile.delete()
        }
    }

    @Test
    fun `update avatar with oversized file`() {
        println("\n=== Test 8: Update Avatar with Oversized File ===")

        // 先登录获取session
        val loginResponse = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", testUsername)
                put("password", encrypt(testPassword))
            }.toJSONString()
        )

        println("Login Response: $loginResponse")
        val loginJson = JSON.parseObject(loginResponse)
        Assert.assertTrue("登录失败", loginJson.getBoolean("success") == true)

        // 创建一个超过1MB的文件
        val tempFile = java.io.File.createTempFile("test_avatar", ".jpg")
        // 创建2MB的数据
        val oversizedData = ByteArray(2 * 1024 * 1024) { 0x00 }
        tempFile.writeBytes(oversizedData)

        try {
            val response = cn.hutool.http.HttpRequest.post("$baseUrl/api/user/update-avatar")
                .form("file", tempFile)
                .execute()

            println("Update Avatar Response: ${response.body()}")
            val jsonResponse = JSON.parseObject(response.body())
            Assert.assertTrue("应该返回错误", jsonResponse.getBoolean("success") == false)
            Assert.assertTrue(
                "错误信息应包含文件大小提示",
                jsonResponse.getString("message")?.contains("文件大小") == true
            )

            println("✓ Oversized file rejected as expected")
        } finally {
            tempFile.delete()
        }
    }

    @Test
    fun `update avatar without login`() {
        println("\n=== Test 9: Update Avatar Without Login ===")

        // 创建一个小的测试图片
        val testImageData = byteArrayOf(
            0x89.toByte(), 0x50.toByte(), 0x4E.toByte(), 0x47.toByte(), 0x0D.toByte(), 0x0A.toByte(),
            0x1A.toByte(), 0x0A.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x0D.toByte(),
            0x49.toByte(), 0x48.toByte(), 0x44.toByte(), 0x52.toByte(), 0x00.toByte(), 0x00.toByte(),
            0x00.toByte(), 0x01.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x01.toByte(),
            0x08.toByte(), 0x06.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x1F.toByte(),
            0x15.toByte(), 0xC4.toByte(), 0x89.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(),
            0x0A.toByte(), 0x49.toByte(), 0x44.toByte(), 0x41.toByte(), 0x54.toByte(), 0x78.toByte(),
            0x9C.toByte(), 0x63.toByte(), 0x00.toByte(), 0x01.toByte(), 0x00.toByte(), 0x00.toByte(),
            0x05.toByte(), 0x00.toByte(), 0x01.toByte(), 0x0D.toByte(), 0x0A.toByte(), 0x2D.toByte(),
            0xB4.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x49.toByte(),
            0x45.toByte(), 0x4E.toByte(), 0x44.toByte(), 0xAE.toByte(), 0x42.toByte(), 0x60.toByte(),
            0x82.toByte()
        )

        val tempFile = java.io.File.createTempFile("test_avatar", ".png")
        tempFile.writeBytes(testImageData)

        try {
            // 不登录直接上传头像
            val response = cn.hutool.http.HttpRequest.post("$baseUrl/api/user/update-avatar")
                .form("file", tempFile)
                .execute()

            println("Update Avatar Response: ${response.body()}")
            val jsonResponse = JSON.parseObject(response.body())
            Assert.assertTrue("未登录应该返回错误", jsonResponse.getBoolean("success") == false)
            Assert.assertTrue(
                "错误信息应包含会话提示",
                jsonResponse.getString("message")?.contains("会话") == true ||
                    jsonResponse.getString("message")?.contains("登录") == true
            )

            println("✓ Unauthenticated request rejected as expected")
        } finally {
            tempFile.delete()
        }
    }
}
