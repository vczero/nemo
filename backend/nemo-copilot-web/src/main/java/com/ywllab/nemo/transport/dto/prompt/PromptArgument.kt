package com.ywllab.nemo.transport.dto.prompt

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Prompt argument definition
 */
@ApiModel(description = "Prompt argument definition")
open class PromptArgument {

    @ApiModelProperty("Argument name")
    var name: String? = null

    @ApiModelProperty("Argument description")
    var description: String? = null

    @ApiModelProperty("Whether it is a required argument")
    var required: Boolean? = null
}
