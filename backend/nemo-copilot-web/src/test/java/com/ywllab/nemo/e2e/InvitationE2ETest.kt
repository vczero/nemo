package com.ywllab.nemo.e2e

import cn.hutool.http.HttpUtil
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import org.junit.Assert
import org.junit.Test

/***
 * 使用hutool的HttpUtil来发送请求
 * 测试场景
 * 1. 邀请码分页查询
 * 2. 邀请码查询
 * 3. 邀请记录分页查询
 * 4. 邀请统计查询
 */
class InvitationE2ETest {

    private val baseUrl: String
        get() = "http://127.0.0.1:8770"

    @Test
    fun `invitation codes page query`() {
        println("\n=== Test 1: Invitation Codes Page Query ===")

        val response = HttpUtil.post(
            "$baseUrl/boss/api/invitation/codes/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
            }.toJSONString()
        )

        println("Codes Page Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("邀请码分页查询失败", jsonResponse.getBoolean("success") == true)

        val list = jsonResponse.getJSONArray("value")
        Assert.assertNotNull("邀请码列表不能为空", list)
        println("✓ Found ${list.size} invitation codes")

        if (list.size > 0) {
            val firstCode = list.getJSONObject(0)
            println("First code: ${firstCode.getString("code")}")
        }
    }

    @Test
    fun `invitation codes page query with inviter filter`() {
        println("\n=== Test 2: Invitation Codes Page Query with Inviter Filter ===")

        val response = HttpUtil.post(
            "$baseUrl/boss/api/invitation/codes/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
                put("inviterId", "2015709046363910144")
            }.toJSONString()
        )

        println("Codes Page Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("邀请码分页查询失败", jsonResponse.getBoolean("success") == true)
        val list = jsonResponse.getJSONArray("value")
        println("✓ Found ${list.size} invitation codes for inviter")
    }

    @Test
    fun `invitation records page query`() {
        println("\n=== Test 3: Invitation Records Page Query ===")

        val response = HttpUtil.post(
            "$baseUrl/boss/api/invitation/records/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
            }.toJSONString()
        )

        println("Records Page Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("邀请记录分页查询失败", jsonResponse.getBoolean("success") == true)

        val list = jsonResponse.getJSONArray("value")
        Assert.assertNotNull("邀请记录列表不能为空", list)
        println("✓ Found ${list.size} invitation records")

        if (list.size > 0) {
            val firstRecord = list.getJSONObject(0)
            println(
                "First record: inviter=${firstRecord.getString("inviterUsername")}, invitee=${
                firstRecord.getString(
                    "inviteeUsername"
                )
                }"
            )
        }
    }

    @Test
    fun `invitation statistics query`() {
        println("\n=== Test 4: Invitation Statistics Query ===")

        val response = HttpUtil.get("$baseUrl/boss/api/invitation/statistics")

        println("Statistics Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("邀请统计查询失败", jsonResponse.getBoolean("success") == true)

        val statistics = jsonResponse.getJSONObject("value")
        val totalCodes = statistics.getIntValue("totalCodes")
        val totalInvitations = statistics.getIntValue("totalInvitations")
        val totalInviters = statistics.getIntValue("totalInviters")
        val totalInvitees = statistics.getIntValue("totalInvitees")

        println("✓ Statistics:")
        println("  Total Codes: $totalCodes")
        println("  Total Invitations: $totalInvitations")
        println("  Total Inviters: $totalInviters")
        println("  Total Invitees: $totalInvitees")

        Assert.assertTrue("总邀请数应该 >= 0", totalInvitations >= 0)
    }
}
