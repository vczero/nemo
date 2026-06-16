package com.ywllab.nemo.dto.agent

import com.ywllab.nemo.model.AgentRoundLog
import com.ywllab.nemo.model.AgentSession
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("会话详情响应")
class SessionDetailDto {
    @ApiModelProperty("会话信息")
    lateinit var session: AgentSession

    @ApiModelProperty("轮次列表")
    lateinit var rounds: List<AgentRoundLog>
}
