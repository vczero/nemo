package com.ywllab.nemo.transport.dto.tool

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Tool output parameter schema definition
 */
@ApiModel(description = "Tool output parameter schema definition")
class OutputSchema {

    @ApiModelProperty("Parameter type, e.g. object, array, string, etc.")
    var type: String = "object"

    @ApiModelProperty("Object property definitions")
    var properties: Map<String, Schema> = emptyMap()

    @ApiModelProperty("Required field markers")
    var required: List<String>? = null
}
