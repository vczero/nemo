package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Resource-related capabilities
 */
@ApiModel(description = "Resource-related capabilities")
class ResourceCapabilities {

    @ApiModelProperty("Whether to support client subscription to resource updates")
    var subscribe: Boolean = false

    @ApiModelProperty("Whether to support resource list change notifications")
    var listChanged: Boolean = false
}
