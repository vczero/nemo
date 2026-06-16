package com.ywllab.nemo.util

import cn.hutool.http.HttpRequest
import cn.hutool.http.HttpResponse
import com.alibaba.fastjson.JSON
import com.ywllab.nemo.dto.compute.llm.BatchStatusResponse
import com.ywllab.nemo.dto.compute.llm.CreateBatchRequest
import com.ywllab.nemo.dto.compute.llm.CreateBatchResponse
import org.slf4j.LoggerFactory

/**
 * Batch API调用工具类
 * 支持OpenAI兼容的Batch接口（文件上传、创建任务、查询状态、下载结果）
 */
object LLMBatchApiUtil {
    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * 创建Batch任务
     * @param baseUrl API地址
     * @param request 创建Batch请求
     * @return 创建Batch响应
     */
    fun createBatch(
        baseUrl: String,
        headerMap: Map<String, String>,
        timeoutMs: Int,
        request: CreateBatchRequest
    ): CreateBatchResponse {
        val batchUrl = "$baseUrl/v1/batches"
        val httpRequest = HttpRequest.post(batchUrl)
            .headerMap(headerMap, true)
            .header("Content-Type", "application/json")

        val response = httpRequest
            .body(JSON.toJSONString(request))
            .timeout(timeoutMs)
            .execute()

        return parseResponse(response, CreateBatchResponse::class.java)
    }

    /**
     * 查询Batch任务状态
     * @param baseUrl API地址
     * @param batchId Batch任务ID
     * @return Batch状态响应
     */
    fun queryBatchStatus(
        baseUrl: String,
        headerMap: Map<String, String>,
        timeoutMs: Int,
        batchId: String
    ): BatchStatusResponse {
        val statusUrl = "$baseUrl/v1/batches/$batchId"
        val request = HttpRequest.get(statusUrl)
            .headerMap(headerMap, true)

        val response = request
            .timeout(timeoutMs)
            .execute()

        return parseResponse(response, BatchStatusResponse::class.java)
    }

    /**
     * 下载Batch结果文件内容
     * @param baseUrl API地址
     * @param outputFileId 输出文件ID
     * @return 结果文件内容（JSONL格式）
     */
    fun downloadResultFile(
        baseUrl: String,
        headerMap: Map<String, String>,
        timeoutMs: Int,
        outputFileId: String
    ): String? {
        val downloadUrl = "$baseUrl/v1/files/$outputFileId/content"
        val request = HttpRequest.get(downloadUrl)
            .headerMap(headerMap, true)

        val response = request
            .timeout(timeoutMs)
            .execute()

        return if (response.isOk && response.body().isNotBlank()) {
            response.body()
        } else {
            log.error(
                "下载Batch结果文件失败, outputFileId={}, status={}, body={}",
                outputFileId, response.status, response.body()
            )
            null
        }
    }

    /**
     * 解析HTTP响应
     */
    @Suppress("UNCHECKED_CAST")
    private fun <T> parseResponse(response: HttpResponse, clazz: Class<T>): T {
        return if (response.isOk && response.body().isNotBlank()) {
            JSON.parseObject(response.body(), clazz)
        } else {
            val errorMsg = "HTTP ${response.status}: ${response.body()}"
            log.error("API调用失败: {}", errorMsg)
            // 返回包含错误信息的响应对象
            when (clazz) {

                CreateBatchResponse::class.java -> {
                    val resp = CreateBatchResponse().apply {
                        error = errorMsg
                    }
                    resp as T
                }

                BatchStatusResponse::class.java -> {
                    val resp = BatchStatusResponse().apply {
                        error = errorMsg
                    }
                    resp as T
                }

                else -> throw IllegalArgumentException("Unsupported response type: ${clazz.name}")
            }
        }
    }
}
