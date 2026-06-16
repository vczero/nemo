package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Initialize response data
 */
@ApiModel(description = "Initialize response data")
open class InitializeResult : Result() {

    @ApiModelProperty("Protocol version")
    var protocolVersion: String? = null

    @ApiModelProperty("Server capabilities description")
    var capabilities: ServerCapabilities? = null

    @ApiModelProperty("Server information")
    var serverInfo: Implementation? = null

    @ApiModelProperty("Instructions")
    var instructions: String? = null
}
