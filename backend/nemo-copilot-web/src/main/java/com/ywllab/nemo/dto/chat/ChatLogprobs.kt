package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("当前内容的对数概率信息。")
@JsonInclude(JsonInclude.Include.NON_NULL)
class ChatLogprobs {

    @ApiModelProperty("message列表中每个 content 元素中的 token 对数概率信息。")
    var content: List<LogprobsContent>? = null

    class LogprobsContent {
        @ApiModelProperty("当前 token。")
        var token: String? = null

        @ApiModelProperty("当前 token 的 UTF-8 值，格式为整数列表。")
        var bytes: List<Int>? = null

        @ApiModelProperty("当前 token 的对数概率。")
        var logprob: Double? = null

        @ApiModelProperty("在当前 token 位置最有可能的标记及其对数概率的列表。")
        @JsonProperty("top_logprobs")
        var topLogprobs: List<LogprobsContent>? = null
    }
}
