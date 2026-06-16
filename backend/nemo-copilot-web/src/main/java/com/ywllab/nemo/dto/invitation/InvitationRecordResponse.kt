package com.ywllab.nemo.dto.invitation

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请记录响应")
class InvitationRecordResponse {
    @ApiModelProperty("被邀请人用户名", required = true)
    lateinit var inviteeUsername: String

    @ApiModelProperty("被邀请人邮箱")
    var inviteeEmail: String? = null

    @ApiModelProperty("邀请时间（毫秒时间戳）", required = true)
    var inviteTime: Long = 0L
}
