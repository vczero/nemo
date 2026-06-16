package com.ywllab.nemo.transport.dto.request

import com.ywllab.nemo.transport.enum.Method
import io.swagger.annotations.ApiModel

/**
 * Send ping request to check connection status
 */
@ApiModel(description = "Send ping request to check connection status")
class PingRequest : JSONRPCRequest() {

    init {
        method = Method.PING
    }
}
