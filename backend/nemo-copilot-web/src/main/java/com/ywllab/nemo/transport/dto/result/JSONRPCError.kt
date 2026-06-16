package com.ywllab.nemo.transport.dto.result

import com.ywllab.nemo.transport.enum.ErrorCode
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * JSON-RPC error response object
 */
@ApiModel(description = "JSON-RPC error response object")
class JSONRPCError {

    @ApiModelProperty("Error code")
    var code: Int = 0

    @ApiModelProperty("Error message")
    var message: String? = null

    @ApiModelProperty("Additional error information")
    var data: Any? = null

    constructor()

    constructor(errorCode: ErrorCode, message: String? = null) {
        this.code = errorCode.code
        this.message = message
    }
}
