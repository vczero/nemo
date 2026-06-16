package com.ywllab.nemo.schedule.task.llm

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.compute.llm.BatchContentResponseDto
import com.ywllab.nemo.model.compute.ComputeTask
import com.ywllab.nemo.util.LLMInputExcelUtil.LLMInputRow

/**
 * 文本摘要LLM任务
 * 根据输入的摘要要求和限制字数生成摘要
 */
class TextSummaryTask(
    task: ComputeTask,
    taskParams: Map<String, Any>,
    endpointConfig: Map<String, Any>? = null
) : AbstractLlmTask(task, taskParams, endpointConfig) {

    companion object {
        private const val SYSTEM_PROMPT = "你是一名专业的文本摘要专家，擅长将长文本提炼为简洁准确的摘要。"
        // 中文字符转token的估算比例（1汉字 ≈ 2 tokens）
        private const val CHAR_TO_TOKEN_RATIO = 2
    }

    override fun getTaskType(): ComputeType = ComputeType.TEXT_SUMMARY

    /**
     * 获取最大token数（将用户输入的字数转换为token数）
     * 1中文 ≈ 2 tokens
     */
    override fun getMaxTokens(): Int {
        val charLength = taskParams["maxSummaryLength"] as? Int ?: 200
        return charLength * CHAR_TO_TOKEN_RATIO
    }

    override fun buildSystemPrompt(): String = SYSTEM_PROMPT

    override fun buildUserPrompt(llmInputRow: LLMInputRow): String {
        val text = llmInputRow.text
        val purpose = taskParams["purpose"]?.toString() ?: ""

        return buildString {
            appendLine("请根据以下要求对文本进行摘要。")
            if (purpose.isNotBlank()) {
                appendLine()
                appendLine("**摘要用途**：")
                appendLine(purpose)
            }
            appendLine()
            appendLine("**原文内容**：")
            append(text)
            appendLine()
            appendLine()
            append("请输出摘要结果，不要包含任何解释。")
        }
    }

    override fun buildUserPrompt(llmInputRows: List<LLMInputRow>): String {
        val purpose = taskParams["purpose"]?.toString() ?: ""

        // 构建jsonlines格式的输入
        val jsonLines = llmInputRows.mapIndexed { index, row ->
            """{"id":"${row.id}","text":"${row.text.replace("\"", "\\\"")}"}"""
        }.joinToString("\n")

        return buildString {
            appendLine("请对以下文本进行摘要。")
            if (purpose.isNotBlank()) {
                appendLine()
                appendLine("**摘要用途**：")
                appendLine(purpose)
            }
            appendLine()
            appendLine("**输入数据（jsonlines格式）**：")
            append(jsonLines)
            appendLine()
            appendLine()
            appendLine("**输出要求**：")
            appendLine("请以jsonlines格式输出结果，每行对应一个输入，格式：{\"id\":\"xxx\",\"label\":\"摘要内容\"}")
        }
    }

    override fun parseResult(outputLine: BatchContentResponseDto): String? {
        return outputLine.response?.body?.choices?.firstOrNull()?.message?.content?.trim()
    }
}
