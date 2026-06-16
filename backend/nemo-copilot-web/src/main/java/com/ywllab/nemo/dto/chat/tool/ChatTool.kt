package com.ywllab.nemo.dto.chat.tool

import com.fasterxml.jackson.annotation.JsonInclude
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
class ChatTool : Serializable {

    @ApiModelProperty("tools的类型，当前仅支持function。")
    var type = ""

    @ApiModelProperty("模型可以调用的工具列表")
    var function = ChatFunction()

    companion object {
        private const val serialVersionUID: Long = -2655984948046115811L
    }
}
