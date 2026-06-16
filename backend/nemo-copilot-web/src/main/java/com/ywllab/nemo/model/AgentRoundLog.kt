package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("智能体会话轮次")
class AgentRoundLog : BaseColumn() {
    @ApiModelProperty("主键ID")
    lateinit var id: String

    @ApiModelProperty("会话ID")
    var sessionId: String = ""

    @ApiModelProperty("文件ID列表")
    var fileIdList: List<String> = emptyList()

    @ApiModelProperty("父级ID")
    var parentId: String = ""

    @ApiModelProperty("角色")
    var role: String = ""

    @ApiModelProperty("消息内容")
    var content: String = ""

    @ApiModelProperty("思考内容")
    var reasoningContent: String = ""

    @ApiModelProperty("花费时间")
    var spendTime: Int = 0

    @ApiModelProperty("工具调用结果JSON数组")
    var toolCallResult: String = ""
}
