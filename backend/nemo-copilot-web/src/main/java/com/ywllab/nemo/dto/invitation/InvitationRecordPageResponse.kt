package com.ywllab.nemo.dto.invitation

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请记录列表响应")
class InvitationRecordPageResponse {
    @ApiModelProperty("ID")
    lateinit var id: String

    @ApiModelProperty("邀请人用户ID")
    lateinit var inviterId: String

    @ApiModelProperty("被邀请人用户ID")
    lateinit var inviteeId: String

    @ApiModelProperty("使用的邀请码")
    var invitationCode: String = ""

    @ApiModelProperty("邀请时间（毫秒时间戳）")
    var inviteTime: Long = 0L

    @ApiModelProperty("邀请人用户名")
    var inviterUsername: String? = null

    @ApiModelProperty("邀请人邮箱")
    var inviterEmail: String? = null

    @ApiModelProperty("被邀请人用户名")
    var inviteeUsername: String? = null

    @ApiModelProperty("被邀请人邮箱")
    var inviteeEmail: String? = null
}
