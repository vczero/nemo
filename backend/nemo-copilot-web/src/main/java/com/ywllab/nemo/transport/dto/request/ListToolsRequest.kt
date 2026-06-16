package com.ywllab.nemo.transport.dto.request

import com.ywllab.nemo.transport.enum.Method
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * Request to list available tools
 */
@ApiModel(description = "Request to list available tools")
class ListToolsRequest : JSONRPCRequest() {

    init {
        method = Method.TOOLS_LIST
    }

    @ApiModelProperty("Pagination parameters")
    var params: ListToolsParams? = null
}
