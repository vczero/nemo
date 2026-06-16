package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Prompt-related capabilities
 */
@ApiModel(description = "Prompt-related capabilities")
class PromptCapabilities {

    @ApiModelProperty("Whether to support prompt list change notifications")
    var listChanged: Boolean = false
}
