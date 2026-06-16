package com.ywllab.nemo.schedule.task.llm

import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSON
import com.ywllab.nemo.constant.ChartType
import com.ywllab.nemo.constant.ClassificationType
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.compute.ClassificationParamsDto
import com.ywllab.nemo.dto.compute.llm.BatchContentResponseDto
import com.ywllab.nemo.dto.compute.llm.BatchJsonLine
import com.ywllab.nemo.dto.compute.llm.ChatCompletionRequest
import com.ywllab.nemo.dto.compute.llm.ChatMessage
import com.ywllab.nemo.model.compute.ComputeTask
import com.ywllab.nemo.util.LLMInputExcelUtil.LLMInputRow

/**
 * LLM Batch任务抽象基类
 * 所有LLM类型的计算任务都继承此类
 */
abstract class AbstractLlmTask(
    protected val task: ComputeTask,
    protected val taskParams: Map<String, Any>,
    protected val endpointConfig: Map<String, Any>? = null
) {

    /**
     * 获取任务类型
     */
    abstract fun getTaskType(): ComputeType

    /**
     * 获取模型名称
     * 优先从endpointConfig获取，否则从taskParams获取
     */
    open fun getModel(): String {
        return endpointConfig?.get("model")?.toString() ?: "qwen-plus"
    }

    /**
     * 获取图表类型列表
     * 子类可覆盖此方法返回对应的图表类型
     */
    open fun getChartTypes(): List<ChartType> = emptyList()

    /**
     * 获取温度参数
     * 优先从endpointConfig获取，否则从taskParams获取
     */
    open fun getTemperature(): Double? {
        return endpointConfig?.get("temperature")?.toString()?.toDouble()
    }

    /**
     * 获取最大token数
     */
    open fun getMaxTokens(): Int {
        return endpointConfig?.get("max_tokens")?.toString()?.toInt() ?: 32000
    }

    /**
     * 获取分类参数
     */
    protected fun getClassificationParams(): ClassificationParamsDto? {
        return try {
            val paramsJson = JSON.toJSONString(taskParams)
            JSON.parseObject(paramsJson, ClassificationParamsDto::class.java)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 获取分类类别列表
     */
    protected fun getCategories(): List<ClassificationParamsDto.ClassificationCategoryDto> {
        return getClassificationParams()?.categories ?: emptyList()
    }

    /**
     * 获取分类类型
     */
    protected fun getClassificationType(): ClassificationType {
        return getClassificationParams()?.classificationType ?: ClassificationType.MULTI_CLASS
    }

    /**
     * 构建分类提示词（通用逻辑）
     * @param taskName 任务名称（如"文本"、"新闻"）
     * @param inputData 输入数据
     */
    protected fun buildClassificationUserPrompt(taskName: String, inputData: Map<String, Any>): String {
        val text = inputData["text"]?.toString()
            ?: inputData["content"]?.toString()
            ?: ""
        val categories = getCategories()
        val categoryList = categories.joinToString("\n") { "- ${it.category}: ${it.description ?: ""}" }
        val classificationType = getClassificationType()
        val isMultiClass = classificationType == ClassificationType.MULTI_CLASS

        return buildString {
            if (isMultiClass) {
                appendLine("请将${taskName}分配到以下类别中，每条${taskName}可以属于一个或多个类别。")
            } else {
                appendLine("请将${taskName}分配到以下类别中，每条${taskName}只能属于一个类别。")
            }
            appendLine()
            appendLine("**类别列表**：")
            appendLine(categoryList)
            appendLine()
            appendLine("**任务要求**：")
            appendLine("1. 根据${taskName}的内容，确定最相关的类别。")
            appendLine("2. 每条${taskName}至少分配1个类别。")
            appendLine("3. 不可以修改任何类别的名称，必须和提供的类别名称保持100%一致，不可以增加类别。")
            if (isMultiClass) {
                appendLine("4. 只能输出结果，不允许提供任何解释。输出格式：类别1@类别2（如果多个，用@分隔）。")
            } else {
                appendLine("4. 只能输出结果，不允许提供任何解释。输出格式：单个类别名称。")
            }
            appendLine()
            appendLine("**${taskName}内容**：")
            append(text)
            appendLine()
            appendLine()
            append("请根据以上内容输出对应的分类标签。")
        }
    }

    /**
     * 解析分类结果（通用逻辑）
     */
    protected fun parseClassificationResult(responseText: String): String {
        val categories = getCategories()
        val classificationType = getClassificationType()
        val text = responseText.trim().replace("。", "").replace(".", "")
        val categoryNames = categories.map { it.category }
        val foundCategories = categoryNames.filter { it in text }

        return if (foundCategories.isEmpty()) {
            "其他"
        } else if (classificationType == ClassificationType.SINGLE_CLASS) {
            foundCategories.first()
        } else {
            foundCategories.joinToString("@")
        }
    }

    /**
     * 构建单条JSONL行
     * @param llmInputRow 输入行
     */
    fun buildJsonLine(llmInputRow: LLMInputRow): BatchJsonLine {
        return BatchJsonLine().apply {
            this.custom_id = "${task.taskId}-${llmInputRow.id}"
            method = "POST"
            url = "/v1/chat/completions"
            body = ChatCompletionRequest().apply {
                model = getModel()
                temperature = getTemperature()
                max_tokens = getMaxTokens()
                messages = buildMessages(llmInputRow)
            }
        }
    }

    /**
     * 构建消息列表（单个输入）
     */
    open fun buildMessages(llmInputRow: LLMInputRow): List<ChatMessage> {
        val messages = mutableListOf<ChatMessage>()
        val systemPrompt = buildSystemPrompt()
        if (systemPrompt.isNotBlank()) {
            messages.add(
                ChatMessage().apply {
                    role = "system"
                    content = systemPrompt
                }
            )
        }
        messages.add(
            ChatMessage().apply {
                role = "user"
                content = buildUserPrompt(llmInputRow)
            }
        )
        return messages
    }

    /**
     * 构建消息列表（批量输入，直接模式）
     * @param llmInputRows 输入行列表
     */
    open fun buildMessages(llmInputRows: List<LLMInputRow>): List<ChatMessage> {
        val messages = mutableListOf<ChatMessage>()
        val systemPrompt = buildSystemPrompt()
        if (systemPrompt.isNotBlank()) {
            messages.add(
                ChatMessage().apply {
                    role = "system"
                    content = systemPrompt
                }
            )
        }
        messages.add(
            ChatMessage().apply {
                role = "user"
                content = buildUserPrompt(llmInputRows)
            }
        )
        return messages
    }

    /**
     * 构建用户提示词（单个输入）
     */
    protected abstract fun buildUserPrompt(llmInputRow: LLMInputRow): String

    /**
     * 构建批量用户提示词（直接模式，合并多条输入为jsonlines格式）
     */
    protected abstract fun buildUserPrompt(llmInputRows: List<LLMInputRow>): String

    /**
     * 构建系统提示词
     */
    protected abstract fun buildSystemPrompt(): String

    /**
     * 解析任务结果
     */
    open fun parseResult(outputLine: BatchContentResponseDto): String? {
        return outputLine.response?.body?.choices?.firstOrNull()?.message?.content?.trim()
    }

    /**
     * 解析批量任务结果（jsonlines格式的单行）
     * 子类可覆盖此方法自定义解析逻辑
     */
    open fun parseBatchResult(resultLine: String): String {
        // 默认实现：尝试解析为JSON获取label字段
        return try {
            val json = JSONUtil.parseObj(resultLine)
            json.getStr("label")?.trim() ?: resultLine.trim()
        } catch (e: Exception) {
            resultLine.trim()
        }
    }

    /**
     * 检查结果是否有效
     */
    open fun isValidResult(outputLine: BatchContentResponseDto): Boolean {
        return outputLine.response?.body?.choices?.firstOrNull()?.message?.content?.isNotBlank() == true
    }
}
