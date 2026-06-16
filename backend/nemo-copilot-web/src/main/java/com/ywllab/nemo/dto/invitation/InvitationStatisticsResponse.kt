package com.ywllab.nemo.dto.invitation

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请统计响应")
class InvitationStatisticsResponse {
    @ApiModelProperty("总邀请码数", required = true)
    var totalCodes: Int = 0

    @ApiModelProperty("总邀请记录数", required = true)
    var totalInvitations: Int = 0

    @ApiModelProperty("邀请人数", required = true)
    var totalInviters: Int = 0

    @ApiModelProperty("被邀请人数", required = true)
    var totalInvitees: Int = 0
}
