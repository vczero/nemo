package com.ywllab.nemo.dto.compute.llm

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * OpenAI兼容Chat Completion请求
 * 用于JSONL输入文件的body部分
 */
@ApiModel("Chat Completion请求")
class ChatCompletionRequest {
    @ApiModelProperty("模型")
    var model: String? = null

    @ApiModelProperty("消息列表")
    var messages: List<ChatMessage>? = null

    @ApiModelProperty("温度")
    var temperature: Double? = null

    @ApiModelProperty("最大token数")
    var max_tokens: Int? = null
}

/**
 * Chat消息
 */
@ApiModel("Chat消息")
class ChatMessage {
    @ApiModelProperty("角色")
    var role: String? = null

    @ApiModelProperty("内容")
    var content: String? = null
}

/**
 * Batch API JSONL行结构
 */
@ApiModel("Batch API JSONL行")
class BatchJsonLine {
    @ApiModelProperty("自定义ID")
    var custom_id: String? = null

    @ApiModelProperty("请求方法")
    var method: String? = null

    @ApiModelProperty("请求URL")
    var url: String? = null

    @ApiModelProperty("请求体")
    var body: ChatCompletionRequest? = null
}
