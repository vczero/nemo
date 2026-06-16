package com.ywllab.nemo.dto.chat.tool

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.JsonNode
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
class ChatFunction : Serializable {

    @ApiModelProperty("工具函数的名称，必须是字母、数字，可以包含下划线和短划线，最大长度为64。")
    var name = ""

    @ApiModelProperty("工具函数的描述，供模型选择何时以及如何调用工具函数。")
    var description = ""

    @ApiModelProperty("工具的参数描述，需要是一个合法的JSON Schema。")
    var parameters: JsonNode? = null

    companion object {
        private const val serialVersionUID: Long = 2120838548861859032L
    }
}
