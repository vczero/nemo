package com.ywllab.nemo.schedule.task.llm

import com.ywllab.nemo.constant.ChartType
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.compute.llm.BatchContentResponseDto
import com.ywllab.nemo.model.compute.ComputeTask
import com.ywllab.nemo.util.LLMInputExcelUtil.LLMInputRow

/**
 * 情感分类LLM任务
 * 默认3个类别：积极、消极、中性
 */
class SentimentClassificationTask(
    task: ComputeTask,
    taskParams: Map<String, Any>,
    endpointConfig: Map<String, Any>? = null
) : AbstractLlmTask(task, taskParams, endpointConfig) {
    override fun getTaskType(): ComputeType = ComputeType.SENTIMENT_CLASSIFICATION

    override fun getChartTypes(): List<ChartType> = listOf(ChartType.PIE)

    override fun buildSystemPrompt(): String {
        val categories = getCategories()
        val categoryList = categories.joinToString("、") { it.category }

        return buildString {
            appendLine("你是一名专业的情感分析专家，擅长判断文本的情感倾向。")
            appendLine("**情感类别**：$categoryList")
            appendLine("每条文本只能属于一个情感类别。")
            appendLine("输出：jsonlines格式，每行{\"id\":\"xxx\",\"label\":\"情感类别\"}")
            appendLine("不可修改类别名称，不可增加类别。")
        }
    }

    override fun buildUserPrompt(llmInputRow: LLMInputRow): String {
        return """{"id":"${llmInputRow.id}","text":"${llmInputRow.text.replace("\"", "\\\"")}"}"""
    }

    override fun buildUserPrompt(llmInputRows: List<LLMInputRow>): String {
        return llmInputRows.joinToString("\n") { row ->
            """{"id":"${row.id}","text":"${row.text.replace("\"", "\\\"")}"}"""
        }
    }

    override fun parseResult(outputLine: BatchContentResponseDto): String? {
        val responseText = outputLine.response?.body?.choices?.firstOrNull()?.message?.content?.trim() ?: return null
        return parseClassificationResult(responseText)
    }
}
