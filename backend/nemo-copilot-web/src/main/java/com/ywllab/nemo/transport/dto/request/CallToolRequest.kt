package com.ywllab.nemo.transport.dto.request

import com.ywllab.nemo.transport.enum.Method
import io.swagger.annotations.ApiModel

/**
 * Tool call request object
 */
@ApiModel(description = "Tool call request object")
class CallToolRequest : JSONRPCRequest() {

    init {
        method = Method.TOOLS_CALL
    }

    lateinit var params: CallToolParams
}
