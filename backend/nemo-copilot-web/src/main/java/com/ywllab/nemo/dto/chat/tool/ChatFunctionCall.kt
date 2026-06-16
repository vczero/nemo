package com.ywllab.nemo.dto.chat.tool

import com.fasterxml.jackson.annotation.JsonInclude
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
class ChatFunctionCall : Serializable {

    @ApiModelProperty("需要被调用的函数名。")
    var name: String? = null

    @ApiModelProperty("需要输入到工具中的参数，为JSON字符串。")
    var arguments: String? = null

    companion object {
        private const val serialVersionUID: Long = -601460091510600604L
    }
}
