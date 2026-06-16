package com.ywllab.nemo.dto.chat.tool

import com.fasterxml.jackson.annotation.JsonInclude
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
class ChatToolCall : Serializable {

    @ApiModelProperty("本次工具响应的ID")
    var id: String? = null

    @ApiModelProperty("工具的类型，当前只支持function。")
    var type: String? = null

    @ApiModelProperty("需要被调用的函数。")
    var function: ChatFunctionCall? = null

    @ApiModelProperty("工具信息在tool_calls列表中的索引。")
    var index = 0

    companion object {
        private const val serialVersionUID: Long = -5259533909209652132L
    }
}
