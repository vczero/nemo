package com.ywllab.nemo.dto.invitation

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请码信息")
class InvitationInfo {

    @ApiModelProperty("邀请码")
    lateinit var invitationCode: String

    @ApiModelProperty("邀请人奖励积分数")
    var inviterRewardPoints: Int = 0

    @ApiModelProperty("被邀请人奖励积分数")
    var inviteeRewardPoints: Int = 0
}
