package com.ywllab.nemo.transport.dto.resource

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Resource information
 */
@ApiModel(description = "Resource information")
open class Resource {

    @ApiModelProperty("Resource URI")
    var uri: String? = null

    @ApiModelProperty("Resource name")
    var name: String? = null

    @ApiModelProperty("Resource description")
    var description: String? = null

    @ApiModelProperty("Resource MIME type")
    var mimeType: String? = null
}
