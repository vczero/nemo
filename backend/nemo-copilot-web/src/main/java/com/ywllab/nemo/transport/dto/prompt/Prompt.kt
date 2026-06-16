package com.ywllab.nemo.transport.dto.prompt

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Prompt or template information
 */
@ApiModel(description = "Prompt or template information")
open class Prompt {

    @ApiModelProperty("Prompt name")
    var name: String? = null

    @ApiModelProperty("Prompt description")
    var description: String? = null

    @ApiModelProperty("Argument list")
    var arguments: List<PromptArgument>? = null
}
