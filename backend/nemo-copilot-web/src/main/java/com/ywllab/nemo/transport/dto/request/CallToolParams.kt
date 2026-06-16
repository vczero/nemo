package com.ywllab.nemo.transport.dto.request

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Tool call parameters object
 */
@ApiModel(description = "Tool call parameters object")
class CallToolParams {

    @ApiModelProperty("Tool name")
    lateinit var name: String

    @ApiModelProperty("Tool call arguments")
    var arguments: Map<String, Any?> = emptyMap()
}
