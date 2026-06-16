package com.ywllab.nemo.util

import com.alibaba.fastjson.JSON
import com.ywllab.nemo.dto.compute.llm.BatchContentResponseDto
import com.ywllab.nemo.dto.compute.openai.ResponseData
import com.ywllab.nemo.schedule.task.llm.AbstractLlmTask
import com.ywllab.nemo.util.LLMInputExcelUtil.LLMInputRow
import org.slf4j.LoggerFactory

/**
 * LLM计算任务结果解析工具类
 * 统一处理直接API调用和Batch模式的响应解析
 */
object LlmResultParser {
    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * 结果解析结果
     */
    data class ParseResult(
        val labelMap: Map<String, String>,
        val failCustomIds: Set<String>,
        val successCount: Int,
        val totalInputTokens: Int,
        val totalOutputTokens: Int
    )

    /**
     * 解析直接API响应结果
     * 将ResponseData转换为List<BatchContentResponseDto>
     * @param llmInputRows 输入行列表（用于获取id和顺序）
     * @param responseData API响应数据
     * @param llmTask LLM任务实例（用于解析批量结果）
     * @return 解析后的BatchContentResponseDto列表
     */
    fun parseDirectResponse(
        taskId: String,
        llmInputRows: List<LLMInputRow>,
        responseData: ResponseData,
        llmTask: AbstractLlmTask
    ): List<BatchContentResponseDto> {
        val outputLines = mutableListOf<BatchContentResponseDto>()

        // 获取响应文本
        val responseText = responseData.output?.firstOrNull()?.content?.firstOrNull()?.text ?: return outputLines

        // 按行分割结果（假设返回结果也是jsonlines格式，每行对应一个输入）
        val resultLines = responseText.split("\n").filter { it.isNotBlank() }

        // 直接API的token使用量（按行均分）
        val totalInputTokens = responseData.usage?.inputTokens ?: 0
        val totalOutputTokens = responseData.usage?.outputTokens ?: 0
        val lineCount = resultLines.size.coerceAtLeast(1)
        val inputTokensPerLine = totalInputTokens / lineCount
        val outputTokensPerLine = totalOutputTokens / lineCount

        for (i in llmInputRows.indices) {
            if (i >= resultLines.size) break
            val inputRow = llmInputRows[i]
            val resultLine = resultLines[i]

            try {
                // 解析结果文本
                val result = llmTask.parseBatchResult(resultLine)
                val outputLine = BatchContentResponseDto().apply {
                    customId = "$taskId-${inputRow.id}"
                    this.response = BatchContentResponseDto.BatchResponse().apply {
                        statusCode = 200
                        this.body = BatchContentResponseDto.BatchResponse.Body().apply {
                            this.id = "direct-${inputRow.id}"
                            this.model = responseData.model ?: ""
                            this.usage = BatchContentResponseDto.BatchResponse.Body.Usage().apply {
                                promptTokens = inputTokensPerLine
                                completionTokens = outputTokensPerLine
                                totalTokens = inputTokensPerLine + outputTokensPerLine
                            }
                            this.choices = listOf(
                                BatchContentResponseDto.BatchResponse.Body.Choice().apply {
                                    this.message = BatchContentResponseDto.BatchResponse.Body.Choice.Message().apply {
                                        this.content = result
                                    }
                                }
                            )
                        }
                    }
                }
                outputLines.add(outputLine)
            } catch (e: Exception) {
                log.warn("解析批量结果行失败, id={}, line={}, msg={}", inputRow.id, resultLine, e.message)
            }
        }

        return outputLines
    }

    /**
     * 解析Batch结果文件内容
     * @param resultContent 结果文件内容（JSONL格式）
     * @return 解析后的BatchContentResponseDto列表
     */
    fun parseBatchResultContent(resultContent: String): List<BatchContentResponseDto> {
        return try {
            resultContent.split("\n")
                .filter { it.isNotBlank() }
                .map { JSON.parseObject(it, BatchContentResponseDto::class.java) }
        } catch (e: Exception) {
            log.warn("解析结果行失败: ${e.message}", e)
            throw e
        }
    }

    /**
     * 从error文件内容提取失败的custom_id列表
     * @param errorContent error文件内容
     * @return 失败的custom_id集合
     */
    fun extractErrorCustomIds(errorContent: String?): Set<String> {
        if (errorContent.isNullOrBlank()) return emptySet()
        val errorCustomIds = mutableSetOf<String>()
        errorContent.split("\n").filter { it.isNotBlank() }.forEach { line ->
            try {
                val errorObj = JSON.parseObject(line)
                val customId = errorObj.getString("custom_id")
                if (!customId.isNullOrBlank()) {
                    errorCustomIds.add(customId)
                }
            } catch (e: Exception) {
                log.warn("解析error_file行失败: {}", line)
            }
        }
        return errorCustomIds
    }

    /**
     * 解析输出结果，提取标签和失败ID
     * @param outputLines 输出结果列表
     * @param errorCustomIds 额外的失败custom_id集合（如从error文件获取的）
     * @param llmTask LLM任务实例
     * @return 解析结果
     */
    fun parseOutputLines(
        outputLines: List<BatchContentResponseDto>,
        errorCustomIds: Set<String>,
        llmTask: AbstractLlmTask
    ): ParseResult {
        val labelMap = mutableMapOf<String, String>()
        val failCustomIds = mutableSetOf<String>()
        failCustomIds.addAll(errorCustomIds)
        var successCount = 0
        var totalInputTokens = 0
        var totalOutputTokens = 0

        for (outputLine in outputLines) {
            val customId = outputLine.customId
            // 累加token使用量
            val usage = outputLine.response.body.usage
            totalInputTokens += usage.promptTokens
            totalOutputTokens += usage.completionTokens
            // API级别错误：error字段不为空
            if (outputLine.error != null) {
                failCustomIds.add(customId)
                continue
            }
            // 检查解析结果是否有效
            if (llmTask.isValidResult(outputLine)) {
                val label = llmTask.parseResult(outputLine)!!
                labelMap[customId.split("-")[1]] = label
                if (label.isNotBlank()) {
                    successCount++
                } else {
                    // 解析结果为空也算失败
                    failCustomIds.add(customId)
                }
            } else {
                // 解析失败（无效结果）
                failCustomIds.add(customId)
            }
        }

        return ParseResult(
            labelMap = labelMap,
            failCustomIds = failCustomIds,
            successCount = successCount,
            totalInputTokens = totalInputTokens,
            totalOutputTokens = totalOutputTokens
        )
    }
}
