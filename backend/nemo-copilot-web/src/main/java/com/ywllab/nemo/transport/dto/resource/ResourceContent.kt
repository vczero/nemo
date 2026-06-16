package com.ywllab.nemo.transport.dto.resource

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Resource content object
 */
@ApiModel(description = "Resource content object")
class ResourceContent {

    @ApiModelProperty("Resource URI")
    var uri: String? = null

    @ApiModelProperty("MIME type")
    var mimeType: String? = null

    @ApiModelProperty("Text content")
    var text: String? = null

    @ApiModelProperty("Binary data Base64")
    var blob: String? = null
}
