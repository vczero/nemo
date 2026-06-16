package com.ywllab.nemo.model

import com.ywllab.nemo.constant.AgentType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("智能体会话")
class AgentSession : BaseColumn() {
    @ApiModelProperty("会话ID")
    lateinit var sessionId: String

    @ApiModelProperty("类型")
    var type: AgentType = AgentType.DATA_AGENT

    @ApiModelProperty("会话标题")
    var title: String = ""

    @ApiModelProperty("摘要")
    var summary: String = ""

    @ApiModelProperty("对话提问数")
    var queryNum: Int = 1

    @ApiModelProperty("是否删除")
    var deleted: Boolean = false

    @ApiModelProperty("用户ID")
    var userId: String = ""
}
