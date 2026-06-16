package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请码")
class InvitationCode : BaseColumn() {
    @ApiModelProperty("ID")
    lateinit var invitationCodeId: String

    @ApiModelProperty("邀请码")
    var code: String = ""

    @ApiModelProperty("邀请人用户ID")
    var inviterId: String = ""

    @ApiModelProperty("使用次数")
    var usedCount: Int = 0
}
