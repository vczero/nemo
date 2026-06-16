package com.ywllab.nemo.e2e

import cn.hutool.http.HttpUtil
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import org.junit.Assert
import org.junit.Test

/***
 * 使用hutool的HttpUtil来发送请求
 * 测试场景
 * 1. 通知分页查询
 * 2. 未读数量查询
 * 3. 全部标记已读
 * 4. 批量标记已读
 * 5. 批量标记未读
 * 6. 批量删除
 */
class NotificationE2ETest : BaseTest() {

    @Test
    fun `notification page query`() {
        println("\n=== Test 1: Notification Page Query ===")

        val response = HttpUtil.post(
            "$baseUrl/api/notifications/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
                put("status", "UNREAD")
            }.toJSONString()
        )

        println("Page Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("通知分页查询失败", jsonResponse.getBoolean("success") == true)

        val list = jsonResponse.getJSONArray("value")
        Assert.assertNotNull("通知列表不能为空", list)
        println("✓ Found ${list.size} notifications")

        if (list.size > 0) {
            val firstNotification = list.getJSONObject(0)
            println(
                "First notification: title=${firstNotification.getString("title")}, status=${
                firstNotification.getString(
                    "status"
                )
                }"
            )
        }
    }

    @Test
    fun `notification page query with type filter`() {
        println("\n=== Test 2: Notification Page Query with Type Filter ===")

        val response = HttpUtil.post(
            "$baseUrl/api/notifications/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
                put("status", "UNREAD")
                put("type", "SYSTEM")
            }.toJSONString()
        )

        println("Page Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("通知分页查询失败", jsonResponse.getBoolean("success") == true)
        val list = jsonResponse.getJSONArray("value")
        println("✓ Found ${list.size} system notifications")
    }

    @Test
    fun `notification unread count query`() {
        println("\n=== Test 3: Notification Unread Count Query ===")

        val response = HttpUtil.get("$baseUrl/api/notifications/unread-count")

        println("Unread Count Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("未读数量查询失败", jsonResponse.getBoolean("success") == true)

        val unreadCount = jsonResponse.getJSONObject("value")
        val totalCount = unreadCount.getIntValue("totalCount")

        println("✓ Unread Count: $totalCount")

        Assert.assertTrue("未读数量应该 >= 0", totalCount >= 0)
    }

    @Test
    fun `mark all notifications as read`() {
        println("\n=== Test 4: Mark All Notifications as Read ===")

        // 先查询未读数量
        val beforeResponse = HttpUtil.get("$baseUrl/api/notifications/unread-count")
        val beforeJson = JSON.parseObject(beforeResponse)
        val beforeCount = beforeJson.getJSONObject("value").getIntValue("totalCount")
        println("Unread count before mark all read: $beforeCount")

        // 标记全部已读
        val response = HttpUtil.post("$baseUrl/api/notifications/mark-all-read", "{}")

        println("Mark All Read Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("标记全部已读失败", jsonResponse.getBoolean("success") == true)

        // 再次查询未读数量
        val afterResponse = HttpUtil.get("$baseUrl/api/notifications/unread-count")
        val afterJson = JSON.parseObject(afterResponse)
        val afterCount = afterJson.getJSONObject("value").getIntValue("totalCount")
        println("Unread count after mark all read: $afterCount")

        println("✓ Mark all notifications as read successfully")
    }

    @Test
    fun `batch mark notifications as read`() {
        println("\n=== Test 5: Batch Mark Notifications as Read ===")

        // 先获取一些通知ID
        val pageResponse = HttpUtil.post(
            "$baseUrl/api/notifications/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
                put("status", "UNREAD")
            }.toJSONString()
        )
        val pageJson = JSON.parseObject(pageResponse)
        val list = pageJson.getJSONArray("value")

        if (list.size > 0) {
            val notificationIds = list.map { it as JSONObject }
                .map { it.getString("id") }
                .take(3)

            println("Notification IDs to mark as read: $notificationIds")

            val response = HttpUtil.post(
                "$baseUrl/api/notifications/batch-operation?operation=MARK_READ",
                JSONObject().apply {
                    put("notificationIds", notificationIds)
                }.toJSONString()
            )

            println("Batch Mark Read Response: $response")
            val jsonResponse = JSON.parseObject(response)
            Assert.assertTrue("批量标记已读失败", jsonResponse.getBoolean("success") == true)

            println("✓ Batch mark notifications as read successfully")
        } else {
            println("No notifications found for batch mark read test")
        }
    }

    @Test
    fun `batch mark notifications as unread`() {
        println("\n=== Test 6: Batch Mark Notifications as Unread ===")

        // 先获取一些通知ID
        val pageResponse = HttpUtil.post(
            "$baseUrl/api/notifications/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
            }.toJSONString()
        )
        val pageJson = JSON.parseObject(pageResponse)
        val list = pageJson.getJSONArray("value")

        if (list.size > 0) {
            val notificationIds = list.map { it as JSONObject }
                .map { it.getString("id") }
                .take(3)

            println("Notification IDs to mark as unread: $notificationIds")

            val response = HttpUtil.post(
                "$baseUrl/api/notifications/batch-operation?operation=MARK_UNREAD",
                JSONObject().apply {
                    put("notificationIds", notificationIds)
                }.toJSONString()
            )

            println("Batch Mark Unread Response: $response")
            val jsonResponse = JSON.parseObject(response)
            Assert.assertTrue("批量标记未读失败", jsonResponse.getBoolean("success") == true)

            println("✓ Batch mark notifications as unread successfully")
        } else {
            println("No notifications found for batch mark unread test")
        }
    }

    @Test
    fun `batch delete notifications`() {
        println("\n=== Test 7: Batch Delete Notifications ===")

        // 先获取一些通知ID
        val pageResponse = HttpUtil.post(
            "$baseUrl/api/notifications/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
            }.toJSONString()
        )
        val pageJson = JSON.parseObject(pageResponse)
        val list = pageJson.getJSONArray("value")

        if (list.size > 0) {
            val notificationIds = list.map { it as JSONObject }
                .map { it.getString("id") }
                .take(2)

            println("Notification IDs to delete: $notificationIds")

            val response = HttpUtil.post(
                "$baseUrl/api/notifications/batch-operation?operation=DELETE",
                JSONObject().apply {
                    put("notificationIds", notificationIds)
                }.toJSONString()
            )

            println("Batch Delete Response: $response")
            val jsonResponse = JSON.parseObject(response)
            Assert.assertTrue("批量删除失败", jsonResponse.getBoolean("success") == true)

            println("✓ Batch delete notifications successfully")
        } else {
            println("No notifications found for batch delete test")
        }
    }
}
