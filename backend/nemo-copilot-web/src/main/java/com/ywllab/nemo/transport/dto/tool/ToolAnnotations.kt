package com.ywllab.nemo.transport.dto.tool

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Additional attributes information for tools
 */
@ApiModel(description = "Additional attributes information for tools")
class ToolAnnotations {

    @ApiModelProperty("Human-readable title for the tool")
    var title: String? = null

    @ApiModelProperty("Whether this is a read-only tool")
    var readOnlyHint: Boolean? = null

    @ApiModelProperty("Whether this may be destructive")
    var destructiveHint: Boolean? = null

    @ApiModelProperty("Whether calls are idempotent")
    var idempotentHint: Boolean? = null

    @ApiModelProperty("Whether this interacts with the external world")
    var openWorldHint: Boolean? = null
}
