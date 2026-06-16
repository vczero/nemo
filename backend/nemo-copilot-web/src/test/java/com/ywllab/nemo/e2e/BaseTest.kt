package com.ywllab.nemo.e2e

import cn.hutool.http.HttpUtil
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import com.ywllab.nemo.util.CryptoUtil
import org.junit.Before

open class BaseTest {
    var testUserId: String = ""
    val baseUrl: String
        get() = "http://127.0.0.1:8770"

    companion object {
        private const val TEST_USERNAME = "nemo"
        var TEST_PASSWORD = "123456"
    }

    /**
     * 前置条件：先登录获取用户身份
     */
    @Before
    fun login() {
        println("\n=== Setup: Login ===")

        val response = HttpUtil.post(
            "$baseUrl/api/user/login",
            JSONObject().apply {
                put("username", TEST_USERNAME)
                put("password", CryptoUtil.encrypt(TEST_PASSWORD))
            }.toJSONString()
        )

        println("Login Response: $response")
        val jsonResponse = JSON.parseObject(response)

        if (jsonResponse.getBoolean("success") == true) {
            val value = jsonResponse.getJSONObject("value")
            testUserId = value.getString("userId")
            println("✓ Login successful, userId: $testUserId")
        } else {
            throw AssertionError("Login failed: $response")
        }
    }
}
