package com.ywllab.nemo.transport.dto.request

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel(description = "初始化参数对象")
class InitializeParams {

    @ApiModelProperty("协议版本")
    var protocolVersion: String = "2025-03-26"

    @ApiModelProperty("客户端能力集合")
    val capabilities = mutableMapOf<String, Any?>()

    @ApiModelProperty("客户端信息")
    val clientInfo = ClientInfo()

    @ApiModel(description = "客户端信息")
    class ClientInfo {

        @ApiModelProperty("客户端名称")
        var name: String = "ywllab:nemo-mcp"

        @ApiModelProperty("客户端版本")
        var version: String = "0.0.3-SNAPSHOT"
    }
}
