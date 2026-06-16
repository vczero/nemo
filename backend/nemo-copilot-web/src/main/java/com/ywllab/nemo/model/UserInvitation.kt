package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请记录")
class UserInvitation : BaseColumn() {
    @ApiModelProperty("ID")
    lateinit var relationId: String

    @ApiModelProperty("邀请人用户ID")
    lateinit var inviterId: String

    @ApiModelProperty("被邀请人用户ID")
    lateinit var inviteeId: String

    @ApiModelProperty("使用的邀请码")
    lateinit var invitationCode: String

    @ApiModelProperty("邀请时间")
    var inviteTime: Long = 0L
}
