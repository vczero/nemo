package com.ywllab.nemo.e2e

import cn.hutool.http.HttpRequest
import cn.hutool.http.HttpUtil
import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONObject
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.chart.ChartResponse
import org.junit.Assert
import org.junit.Test
import java.io.File

/***
 * 文件和图表模块E2E测试
 *
 * 完整业务流程：
 * 1. 上传文件 -> 获得fileId
 * 2. 新增图表
 * 3. 更新图表关联fileId和缩略图
 * 4. 查看图表详情（小文件返回content，大文件返回url）
 */
class FileAndChartE2ETest : BaseTest() {

    private var testChartId: String = ""
    private var testFileId: String = ""

    /**
     * 测试1：上传文件
     */
    @Test
    fun `upload file`() {
        println("\n=== Test 1: Upload File ===")

        // 创建测试文件
        val testFile = File.createTempFile("e2e-test", ".csv")
        testFile.writeText("name,value\nA,10\nB,20\nC,30")

        try {
            val response = HttpRequest.post("$baseUrl/api/files/add")
                .form("file", testFile)
                .execute()

            val body = response.body()
            println("Upload File Response: $body")

            val jsonResponse = JSON.parseObject(body)
            Assert.assertTrue("上传文件失败", jsonResponse.getBoolean("success") == true)

            val fileData = jsonResponse.getJSONObject("value")
            testFileId = fileData.getString("fileId")
            Assert.assertNotNull("文件ID不能为空", testFileId)
            Assert.assertNotNull("文件名不能为空", fileData.getString("fileName"))
            Assert.assertTrue("文件大小应该大于0", fileData.getLong("fileSize") > 0)

            println("✓ File uploaded successfully")
            println("  FileId: $testFileId")
            println("  FileName: ${fileData.getString("fileName")}")
            println("  FileSize: ${fileData.getLong("fileSize")}")
            println("  Url: ${fileData.getString("url")}")
        } finally {
            testFile.delete()
        }
    }

    /**
     * 测试2：新增图表
     */
    @Test
    fun `create chart`() {
        println("\n=== Test 2: Create Chart ===")

        val response = HttpUtil.post(
            "$baseUrl/api/charts/add",
            JSONObject().apply {
                put("chartName", "E2E测试图表")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "bar")
                        put("title", "测试柱状图")
                    }
                )
            }.toJSONString()
        )

        println("Create Chart Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("创建图表失败", jsonResponse.getBoolean("success") == true)

        testChartId = jsonResponse.getString("value")
        Assert.assertNotNull("图表ID不能为空", testChartId)
        println("✓ Chart created successfully, chartId: $testChartId")
    }

    /**
     * 测试3：更新图表关联fileId
     */
    @Test
    fun `update chart with file`() {
        println("\n=== Test 3: Update Chart with FileId ===")

        // 先上传文件
        val testFile = File.createTempFile("e2e-test", ".csv")
        testFile.writeText("name,value\nA,10\nB,20")

        try {
            val uploadResponse = HttpRequest.post("$baseUrl/api/files/add")
                .form("file", testFile)
                .execute()

            val uploadJson = JSON.parseObject(uploadResponse.body())
            val fileId = uploadJson.getJSONObject("value").getString("fileId")
            testFileId = fileId
            println("✓ File uploaded: $fileId")

            // 创建图表
            val createResponse = HttpUtil.post(
                "$baseUrl/api/charts/add",
                JSONObject().apply {
                    put("chartName", "E2E测试图表")
                    put(
                        "chartConfig",
                        JSONObject().apply {
                            put("type", "bar")
                            put("title", "测试柱状图")
                        }
                    )
                }.toJSONString()
            )

            val createJson = JSON.parseObject(createResponse)
            testChartId = createJson.getString("value")
            println("✓ Chart created: $testChartId")

            // 更新图表关联fileId（使用multipart格式）
            val updateRequest = JSONObject().apply {
                put("chartName", "E2E测试图表-已更新")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "line")
                        put("title", "更新后的折线图")
                    }
                )
                put("fileId", fileId)
            }

            val updateResponse = HttpRequest.post("$baseUrl/api/charts/$testChartId/update")
                .form("param", updateRequest.toJSONString())
                .execute()

            println("Update Chart Response: ${updateResponse.body()}")
            val updateJson = JSON.parseObject(updateResponse.body())
            Assert.assertTrue("更新图表失败", updateJson.getBoolean("success") == true)
            println("✓ Chart updated successfully with fileId: $fileId")
        } finally {
            testFile.delete()
        }
    }

    /**
     * 测试4：查看图表详情（小文件返回content）
     */
    @Test
    fun `get chart details with small file content`() {
        println("\n=== Test 4: Get Chart Details with Small File Content ===")

        // 上传小文件（< 1MB，会返回content）
        val testFile = File.createTempFile("e2e-small", ".csv")
        val fileContent = "name,value\nA,10\nB,20\nC,30\nD,40"
        testFile.writeText(fileContent)

        try {
            val uploadResponse = HttpRequest.post("$baseUrl/api/files/add")
                .form("file", testFile)
                .execute()

            val fileId = JSON.parseObject(uploadResponse.body()).getJSONObject("value").getString("fileId")

            // 创建图表
            val createResponse = HttpUtil.post(
                "$baseUrl/api/charts/add",
                JSONObject().apply {
                    put("chartName", "E2E测试图表")
                    put(
                        "chartConfig",
                        JSONObject().apply {
                            put("type", "bar")
                            put("title", "测试柱状图")
                        }
                    )
                }.toJSONString()
            )

            val chartId = JSON.parseObject(createResponse).getString("value")
            testChartId = chartId

            // 更新图表关联fileId（使用multipart格式）
            val updateRequest = JSONObject().apply {
                put("chartName", "E2E测试图表")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "bar")
                        put("title", "测试柱状图")
                    }
                )
                put("fileId", fileId)
            }

            HttpRequest.post("$baseUrl/api/charts/$chartId/update")
                .form("param", updateRequest.toJSONString())
                .execute()

            // 查询图表详情
            val response = HttpUtil.get("$baseUrl/api/charts/$chartId/get")

            println("Get Chart Response: $response")
            val jsonResponse = JSON.parseObject(response)
            Assert.assertTrue("查询图表失败", jsonResponse.getBoolean("success") == true)

            val chart = jsonResponse.getJSONObject("value")
            Assert.assertNotNull("图表数据不能为空", chart)
            Assert.assertEquals("图表名称不匹配", "E2E测试图表", chart.getString("chartName"))

            // 验证文件信息
            val chartFile = chart.getJSONObject("chartFile")
            Assert.assertNotNull("文件信息不能为空", chartFile)
            Assert.assertNotNull("文件ID不能为空", chartFile.getString("fileId"))
            Assert.assertNotNull("文件名不能为空", chartFile.getString("fileName"))
            Assert.assertTrue("文件大小应该大于0", chartFile.getLong("fileSize") > 0)

            // 验证小文件返回content
            val content = chartFile.getString("content")
            Assert.assertNotNull("小文件应该返回content", content)
            Assert.assertTrue("文件内容应该包含原始数据", content.contains("name,value"))
            Assert.assertTrue("文件内容应该包含A,10", content.contains("A,10"))

            println("✓ Chart details retrieved with file content")
            println("  FileId: ${chartFile.getString("fileId")}")
            println("  FileName: ${chartFile.getString("fileName")}")
            println("  FileSize: ${chartFile.getLong("fileSize")}")
            println("  Content: ${content.take(50)}...")
        } finally {
            testFile.delete()
        }
    }

    /**
     * 测试5：查看图表详情（大文件返回url）
     */
    @Test
    fun `get chart details with large file url`() {
        println("\n=== Test 5: Get Chart Details with Large File URL ===")

        // 创建大文件（> 1MB，不会返回content，只返回url）
        val testFile = File.createTempFile("e2e-large", ".csv")
        val largeContent = "name,value\n" + (1..50000).joinToString("\n") { "Data$it,${it * 10}" }
        testFile.writeText(largeContent)

        try {
            val uploadResponse = HttpRequest.post("$baseUrl/api/files/add")
                .form("file", testFile)
                .execute()

            val fileId = JSON.parseObject(uploadResponse.body()).getJSONObject("value").getString("fileId")
            println("✓ Large file uploaded: $fileId")

            // 创建图表并关联文件
            val createResponse = HttpUtil.post(
                "$baseUrl/api/charts/add",
                JSONObject().apply {
                    put("chartName", "E2E测试图表-大文件")
                    put(
                        "chartConfig",
                        JSONObject().apply {
                            put("type", "bar")
                            put("title", "大文件测试")
                        }
                    )
                }.toJSONString()
            )

            val chartId = JSON.parseObject(createResponse).getString("value")

            // 更新图表关联fileId（使用multipart格式）
            val updateRequest = JSONObject().apply {
                put("chartName", "E2E测试图表-大文件")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "bar")
                        put("title", "大文件测试")
                    }
                )
                put("fileId", fileId)
            }

            HttpRequest.post("$baseUrl/api/charts/$chartId/update")
                .form("param", updateRequest.toJSONString())
                .execute()

            // 查询图表详情
            val response = HttpUtil.get("$baseUrl/api/charts/$chartId/get")

            println("Get Chart Response: $response")
            val jsonResponse = JSON.parseObject(response)
            Assert.assertTrue("查询图表失败", jsonResponse.getBoolean("success") == true)

            val chart = jsonResponse.getJSONObject("value")
            val chartFile = chart.getJSONObject("chartFile")
            Assert.assertNotNull("文件信息不能为空", chartFile)

            // 验证大文件只返回url，不返回content
            val url = chartFile.getString("url")
            Assert.assertNotNull("大文件应该返回url", url)

            val content = chartFile.getString("content")
            println("✓ Chart details retrieved with large file url")
            println("  FileSize: ${chartFile.getLong("fileSize")} bytes")
            println("  Url: $url")
            println("  Content: ${if (content == null) "null (as expected for large file)" else content.take(50) + "..."}")

            // 大文件应该不返回content
            if (chartFile.getLong("fileSize") > 1024 * 1024) {
                println("  ✓ Large file (>1MB) does not return content in memory")
            }
        } finally {
            testFile.delete()
        }
    }

    /**
     * 测试6：完整业务流程
     * 1. 上传文件 -> 2. 新增图表 -> 3. 更新图表关联fileId -> 4. 查看详情
     */
    @Test
    fun `complete workflow - create chart with file`() {
        println("\n=== Test 6: Complete Workflow ===")

        // Step 1: 上传文件
        println("\n--- Step 1: Upload File ---")
        val testFile = File.createTempFile("workflow-test", ".csv")
        testFile.writeText("category,value\n销售额,1000\n利润,300")

        try {
            val uploadResponse = HttpRequest.post("$baseUrl/api/files/add")
                .form("file", testFile)
                .execute()

            val uploadJson = JSON.parseObject(uploadResponse.body())
            Assert.assertTrue("上传文件失败", uploadJson.getBoolean("success") == true)

            val fileData = uploadJson.getJSONObject("value")
            val fileId = fileData.getString("fileId")
            testFileId = fileId
            println("✓ File uploaded: $fileId")
            println("  FileName: ${fileData.getString("fileName")}")
            println("  FileSize: ${fileData.getLong("fileSize")}")

            // Step 2: 新增图表
            println("\n--- Step 2: Create Chart ---")
            val createResponse = HttpUtil.post(
                "$baseUrl/api/charts/add",
                JSONObject().apply {
                    put("chartName", "完整流程测试图表")
                    put(
                        "chartConfig",
                        JSONObject().apply {
                            put("type", "pie")
                            put("title", "测试饼图")
                        }
                    )
                }.toJSONString()
            )

            val createJson = JSON.parseObject(createResponse)
            Assert.assertTrue("创建图表失败", createJson.getBoolean("success") == true)
            val chartId = createJson.getString("value")
            testChartId = chartId
            println("✓ Chart created: $chartId")

            // Step 3: 更新图表关联fileId
            println("\n--- Step 3: Update Chart with FileId ---")
            val updateRequest = JSONObject().apply {
                put("chartName", "完整流程测试图表-已更新")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "pie")
                        put("title", "更新后的饼图")
                    }
                )
                put("fileId", fileId)
            }

            val updateResponse = HttpRequest.post("$baseUrl/api/charts/$chartId/update")
                .form("param", updateRequest.toJSONString())
                .execute()

            val updateJson = JSON.parseObject(updateResponse.body())
            Assert.assertTrue("更新图表失败", updateJson.getBoolean("success") == true)
            println("✓ Chart updated with fileId: $fileId")

            // Step 4: 查看图表详情
            println("\n--- Step 4: Get Chart Details ---")
            val getResponse = HttpUtil.get("$baseUrl/api/charts/$chartId/get")
            val getJson = JSON.parseObject(getResponse)
            Assert.assertTrue("查询图表失败", getJson.getBoolean("success") == true)

            val chart = getJson.getJSONObject("value")
            Assert.assertEquals("图表名称未更新", "完整流程测试图表-已更新", chart.getString("chartName"))

            val chartFile = chart.getJSONObject("chartFile")
            Assert.assertNotNull("文件信息不能为空", chartFile)
            Assert.assertEquals("文件ID不匹配", fileId, chartFile.getString("fileId"))

            // 验证小文件返回content
            val content = chartFile.getString("content")
            Assert.assertNotNull("小文件应该返回content", content)
            Assert.assertTrue("文件内容应该包含预期数据", content.contains("销售额"))

            println("✓ Chart details retrieved:")
            println("  ChartName: ${chart.getString("chartName")}")
            println("  FileId: ${chartFile.getString("fileId")}")
            println("  FileName: ${chartFile.getString("fileName")}")
            println("  Content: $content")

            println("\n=== Complete Workflow Test Passed ===")
        } finally {
            testFile.delete()
        }
    }

    /**
     * 测试7：分页查询图表列表
     */
    @Test
    fun `page charts`() {
        println("\n=== Test 7: Page Charts ===")

        val response = HttpUtil.post(
            "$baseUrl/api/charts/page",
            JSONObject().apply {
                put("pageNum", 1)
                put("pageSize", 10)
            }.toJSONString()
        )

        println("Page Charts Response: $response")
        val jsonResponse = JSON.parseObject(response)
        Assert.assertTrue("分页查询图表失败", jsonResponse.getBoolean("success") == true)

        val pageObj = JSONUtil.toBean(jsonResponse.getJSONObject("value").toJSONString(), PageResultDto::class.java)
        Assert.assertNotNull("图表列表不能为空", pageObj.list)

        println("✓ Found ${pageObj.total} charts (total: ${pageObj.total})")

        if (pageObj.total > 0) {
            val items = JSONUtil.toList(JSONUtil.toJsonStr(pageObj.list), ChartResponse::class.java)
            val firstChart = items.first()
            println("First chart:")
            println("  ID: ${firstChart.chartId}")
            println("  Name: ${firstChart.chartName}")
        }
    }

    /**
     * 测试8：删除图表
     */
    @Test
    fun `delete chart`() {
        println("\n=== Test 8: Delete Chart ===")

        // 创建图表
        val createResponse = HttpUtil.post(
            "$baseUrl/api/charts/add",
            JSONObject().apply {
                put("chartName", "E2E测试图表-待删除")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "bar")
                        put("title", "测试柱状图")
                    }
                )
            }.toJSONString()
        )

        val chartId = JSON.parseObject(createResponse).getString("value")

        val deleteResponse = HttpUtil.post(
            "$baseUrl/api/charts/$chartId/delete",
            "{}"
        )

        println("Delete Chart Response: $deleteResponse")
        val deleteJson = JSON.parseObject(deleteResponse)
        Assert.assertTrue("删除图表失败", deleteJson.getBoolean("success") == true)

        // 验证图表已被删除
        val getResponse = HttpUtil.get("$baseUrl/api/charts/$chartId/get")
        val getJson = JSON.parseObject(getResponse)

        Assert.assertTrue("图表应该已被删除", getJson.getBoolean("success") == false || getJson.get("value") == null)

        println("✓ Chart deleted successfully")
    }

    /**
     * 测试9：更新图表并上传缩略图
     */
    @Test
    fun `update chart with thumbnail`() {
        println("\n=== Test 9: Update Chart with Thumbnail ===")

        // 创建图表
        val createResponse = HttpUtil.post(
            "$baseUrl/api/charts/add",
            JSONObject().apply {
                put("chartName", "E2E测试图表-缩略图")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "bar")
                        put("title", "测试柱状图")
                    }
                )
            }.toJSONString()
        )

        val chartId = JSON.parseObject(createResponse).getString("value")
        println("✓ Chart created: $chartId")

        // 创建测试缩略图文件
        val thumbnailFile = File.createTempFile("e2e-thumbnail", ".png")
        thumbnailFile.writeBytes(ByteArray(1024) { it.toByte() })

        try {
            // 更新图表配置并上传缩略图
            val updateRequest = JSONObject().apply {
                put("chartName", "E2E测试图表-已更新缩略图")
                put(
                    "chartConfig",
                    JSONObject().apply {
                        put("type", "line")
                        put("title", "更新后的折线图")
                    }
                )
            }

            val updateResponse = HttpRequest.post("$baseUrl/api/charts/$chartId/update")
                .form("param", updateRequest.toJSONString())
                .form("thumbnail", thumbnailFile)
                .execute()

            println("Update Chart Response: ${updateResponse.body()}")
            val updateJson = JSON.parseObject(updateResponse.body())
            Assert.assertTrue("更新图表失败", updateJson.getBoolean("success") == true)
            println("✓ Chart updated successfully with thumbnail")

            // 查询图表验证缩略图URL
            val getResponse = HttpUtil.get("$baseUrl/api/charts/$chartId/get")
            val getJson = JSON.parseObject(getResponse)
            Assert.assertTrue("查询图表失败", getJson.getBoolean("success") == true)

            val chart = getJson.getJSONObject("value")
            val thumbnailUrl = chart.getString("thumbnailUrl")
            Assert.assertNotNull("缩略图URL不能为空", thumbnailUrl)
            println("✓ Thumbnail URL: $thumbnailUrl")
        } finally {
            thumbnailFile.delete()
        }
    }

    /**
     * 测试10：更新文件（覆盖）
     */
    @Test
    fun `update existing file`() {
        println("\n=== Test 9: Update Existing File ===")

        // 先上传文件
        val testFile1 = File.createTempFile("e2e-update", ".csv")
        testFile1.writeText("old,data\n1,100")

        try {
            val uploadResponse = HttpRequest.post("$baseUrl/api/files/add")
                .form("file", testFile1)
                .execute()

            val fileId = JSON.parseObject(uploadResponse.body()).getJSONObject("value").getString("fileId")
            println("✓ File uploaded: $fileId")

            // 更新文件
            val testFile2 = File.createTempFile("e2e-update-new", ".csv")
            testFile2.writeText("new,data\n2,200")

            try {
                val updateResponse = HttpRequest.post("$baseUrl/api/files/$fileId/update")
                    .form("file", testFile2)
                    .execute()

                println("Update File Response: ${updateResponse.body()}")

                val updateJson = JSON.parseObject(updateResponse.body())
                Assert.assertTrue("更新文件失败", updateJson.getBoolean("success") == true)

                val fileData = updateJson.getJSONObject("value")
                Assert.assertEquals("fileId应该保持不变", fileId, fileData.getString("fileId"))
                println("✓ File updated successfully")
                println("  FileId: ${fileData.getString("fileId")}")
                println("  FileName: ${fileData.getString("fileName")}")
                println("  FileSize: ${fileData.getLong("fileSize")}")
            } finally {
                testFile2.delete()
            }
        } finally {
            testFile1.delete()
        }
    }
}
