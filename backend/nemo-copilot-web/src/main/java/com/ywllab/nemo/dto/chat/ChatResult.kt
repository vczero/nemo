package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
open class ChatResult : Serializable {

    @ApiModelProperty("该对话的唯一标识符")
    var id: String? = null

    @ApiModelProperty("固定为 chat.completion")
    var `object`: String? = null

    @ApiModelProperty("本次请求创建时间的 Unix 时间戳（秒）")
    var created: Long = 0L

    @ApiModelProperty("本次请求实际使用的模型名称和版本")
    var model: String? = null

    @ApiModelProperty("本次请求的模型输出内容")
    var choices: List<ChatChoice> = listOf()

    @ApiModelProperty("本次请求的 token 用量")
    var usage: Usage? = null

    @ApiModelProperty("本次请求的 tokens 和插件消耗(字节火山)")
    @JsonProperty("bot_usage")
    var botUsage: BotUsage? = null

    @ApiModelProperty("知识库/联网的引用结果，表示调用插件的返回值。首chunk返回(字节火山)")
    var references: Any? = null

    companion object {
        private const val serialVersionUID: Long = -8245718828018796594L
    }
}
