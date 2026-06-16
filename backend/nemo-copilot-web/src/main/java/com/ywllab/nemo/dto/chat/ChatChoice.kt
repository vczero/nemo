package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
class ChatChoice : Serializable {

    @ApiModelProperty("当前元素在 choices 列表的索引")
    var index: Long = 0

    @ApiModelProperty("模型输出的内容（流式）")
    var delta: ChatMessage? = null

    @ApiModelProperty("模型输出的内容（非流式）")
    var message: ChatMessage? = null

    @ApiModelProperty("当前内容的对数概率信息。")
    var logprobs: ChatLogprobs? = null

    @ApiModelProperty("模型停止生成 token 的原因")
    @JsonProperty("finish_reason")
    var finishReason: String? = null

    companion object {
        private const val serialVersionUID: Long = 1505828930740470493L
    }
}
