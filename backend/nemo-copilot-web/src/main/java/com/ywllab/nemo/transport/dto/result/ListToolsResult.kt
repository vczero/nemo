package com.ywllab.nemo.transport.dto.result

import com.ywllab.nemo.transport.dto.tool.Tool
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Tool list response result
 */
@ApiModel(description = "Tool list response result")
class ListToolsResult : Result() {

    @ApiModelProperty("Pagination cursor for fetching next page")
    var nextCursor: String? = null

    @ApiModelProperty("Tool information list")
    var tools: List<Tool>? = null
}
