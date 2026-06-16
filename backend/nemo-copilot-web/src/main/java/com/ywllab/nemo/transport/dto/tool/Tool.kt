package com.ywllab.nemo.transport.dto.tool

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Tool basic information
 */
@ApiModel(description = "Tool basic information")
class Tool {

    @ApiModelProperty("Tool name")
    lateinit var name: String

    @ApiModelProperty("Tool description")
    var description: String? = null

    @ApiModelProperty("Tool input parameter schema definition")
    var inputSchema: InputSchema? = null

    @ApiModelProperty("Tool output parameter schema definition")
    var outputSchema: OutputSchema? = null

    @ApiModelProperty("Tool additional information")
    var annotations: ToolAnnotations? = null
}
