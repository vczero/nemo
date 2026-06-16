package com.ywllab.nemo.transport.dto.result

import com.ywllab.nemo.transport.dto.resource.ResourceContent
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Content object
 */
@ApiModel(description = "Content object")
class Content {

    @ApiModelProperty("Content type")
    var type: String? = null

    @ApiModelProperty("Text content")
    var text: String? = null

    @ApiModelProperty("Image data Base64 encoded")
    var data: String? = null

    @ApiModelProperty("MIME type")
    var mimeType: String? = null

    @ApiModelProperty("Resource content")
    var resource: ResourceContent? = null

    companion object {

        @JvmStatic
        fun text(value: String): Content {
            return Content().apply {
                this.type = "text"
                this.text = value
            }
        }
    }
}
