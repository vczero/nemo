package com.ywllab.nemo.transport.dto.request

import com.ywllab.nemo.transport.enum.Method
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel(description = "初始化请求对象")
class InitializeRequest : JSONRPCRequest() {

    init {
        method = Method.INITIALIZE
    }

    @ApiModelProperty("初始化参数")
    val params = InitializeParams()
}
