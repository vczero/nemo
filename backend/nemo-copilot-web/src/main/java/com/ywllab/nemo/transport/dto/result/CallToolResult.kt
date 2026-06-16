package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Tool call result response
 */
@ApiModel(description = "Tool call result response")
open class CallToolResult : Result() {

    @ApiModelProperty("Whether an error occurred")
    var isError: Boolean? = null

    @ApiModelProperty("Unstructured content list")
    var content: List<Content>? = null

    @ApiModelProperty("Structured output content")
    var structuredContent: Map<String, Any>? = null

    companion object {

        @JvmStatic
        fun error(message: String): CallToolResult = CallToolResult().apply {
            isError = true
            structuredContent = mapOf("message" to message)
            content = listOf(Content.text(message))
        }
    }
}
