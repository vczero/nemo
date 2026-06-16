package com.ywllab.nemo.dto.agent

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("工具调用结果")
class ToolResultDto {
    @ApiModelProperty("工具调用ID")
    lateinit var toolCallId: String

    @ApiModelProperty("工具名称")
    lateinit var toolName: String

    @ApiModelProperty("工具参数")
    lateinit var arguments: Map<String, Any>

    @ApiModelProperty("工具执行结果")
    lateinit var result: String
}

@ApiModel("更新工具调用结果请求")
class UpdateToolResultsRequest {
    @ApiModelProperty("工具调用结果列表")
    lateinit var toolResults: List<ToolResultDto>
}
