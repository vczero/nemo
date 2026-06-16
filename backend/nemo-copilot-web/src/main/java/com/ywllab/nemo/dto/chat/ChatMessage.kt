package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.ChatRole
import com.ywllab.nemo.dto.chat.tool.ChatToolCall
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
open class ChatMessage : Serializable {

    @ApiModelProperty("该消息的发起角色", required = true)
    var role: ChatRole? = null

    @ApiModelProperty(
        dataType = "com.ywllab.nemo.dto.chat.ChatMessageContent",
        value = "消息的内容，string 或 array，如果您的输入只有文本，则为 string 类型；如果您的输入包含图像等多模态数据，则为 array 类型。",
        required = true
    )
    var content: Any? = null
        get() { return imageContent ?: field }

    @Deprecated("使用content")
    @ApiModelProperty("已弃用，请使用content")
    @get:JsonIgnore
    @set:JsonProperty
    var imageContent: List<ChatMessageContent>? = null

    @ApiModelProperty("深度思考内容")
    @JsonProperty("reasoning_content")
    var reasoningContent: String? = null

    @ApiModelProperty("发起 Function Calling 后返回的 id，可以通过tool_calls.id获取，用于标记 Tool Message 对应的工具。")
    @JsonProperty("tool_call_id")
    var toolCallId: String? = null

    @ApiModelProperty("在发起 Function Calling后，模型回复的要调用的工具以及调用工具所需的参数。")
    @JsonProperty("tool_calls")
    var toolCalls: List<ChatToolCall>? = null

    constructor(role: ChatRole, content: Any) {
        this.role = role
        this.content = content
    }

    constructor()

    companion object {
        private const val serialVersionUID: Long = -3861684012143672686L
    }
}
