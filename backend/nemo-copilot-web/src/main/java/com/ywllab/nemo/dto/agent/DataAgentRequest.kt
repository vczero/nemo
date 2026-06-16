package com.ywllab.nemo.dto.agent

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("DataAgent completions请求")
class DataAgentRequest {
    @ApiModelProperty("会话ID")
    var sessionId: String = ""

    @ApiModelProperty("用户上传文件返回的ID")
    var fileIds: List<String> = listOf()

    @ApiModelProperty("用户输入文本，单次对话为字符串，多轮对话为数组")
    var input: Any = ""
}
