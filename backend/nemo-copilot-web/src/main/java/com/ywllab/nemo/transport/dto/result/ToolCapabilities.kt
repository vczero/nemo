package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Tool-related capabilities
 */
@ApiModel(description = "Tool-related capabilities")
class ToolCapabilities {

    @ApiModelProperty("Whether to support tool list change notifications")
    var listChanged: Boolean = true
}
