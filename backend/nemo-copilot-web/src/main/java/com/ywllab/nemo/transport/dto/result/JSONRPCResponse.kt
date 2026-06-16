package com.ywllab.nemo.transport.dto.result

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * JSON-RPC response object
 */
@ApiModel(description = "JSON-RPC response object")
open class JSONRPCResponse<T : Result> {

    @ApiModelProperty("JSON-RPC protocol version")
    var jsonrpc: String = "2.0"

    @ApiModelProperty("Request unique identifier")
    lateinit var id: String

    @ApiModelProperty("Response result object")
    lateinit var result: T

    @ApiModelProperty("Error information object")
    var error: JSONRPCError? = null
}
