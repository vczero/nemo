package com.ywllab.nemo.schedule.task.llm

import com.ywllab.nemo.constant.ChartType
import com.ywllab.nemo.constant.ClassificationType
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.compute.llm.BatchContentResponseDto
import com.ywllab.nemo.model.compute.ComputeTask
import com.ywllab.nemo.util.LLMInputExcelUtil.LLMInputRow

/**
 * 文本分类LLM任务
 */
class TextClassificationTask(
    task: ComputeTask,
    taskParams: Map<String, Any>,
    endpointConfig: Map<String, Any>? = null
) : AbstractLlmTask(task, taskParams, endpointConfig) {

    override fun getTaskType(): ComputeType = ComputeType.TEXT_CLASSIFICATION

    override fun getChartTypes(): List<ChartType> = listOf(ChartType.PIE)

    override fun buildSystemPrompt(): String {
        val categories = getCategories()
        val categoryList = categories.joinToString("\n") { "- ${it.category}: ${it.description ?: ""}" }
        val classificationType = getClassificationType()
        val isMultiClass = classificationType == ClassificationType.MULTI_CLASS

        return buildString {
            appendLine("你是一名专业的文本分类专家，擅长将文本分配到正确的类别中。")
            appendLine("**类别列表**：")
            appendLine(categoryList)
            if (isMultiClass) {
                appendLine("每条文本可属于多个类别。")
                appendLine("输出：jsonlines格式，每行{\"id\":\"xxx\",\"label\":\"类别1@类别2\"}")
            } else {
                appendLine("每条文本只能属于一个类别。")
                appendLine("输出：jsonlines格式，每行{\"id\":\"xxx\",\"label\":\"类别名称\"}")
            }
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
