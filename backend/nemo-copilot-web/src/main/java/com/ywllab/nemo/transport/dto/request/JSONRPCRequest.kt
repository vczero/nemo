package com.ywllab.nemo.transport.dto.request

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.util.UUID

/**
 * JSON-RPC request object
 */
@ApiModel(description = "JSON-RPC request object")
open class JSONRPCRequest {

    @ApiModelProperty("JSON-RPC protocol version")
    var jsonrpc: String = "2.0"

    @ApiModelProperty("Request unique identifier")
    var id = UUID.randomUUID().toString().replace("-", "")

    @ApiModelProperty("Request method name")
    lateinit var method: String
}
