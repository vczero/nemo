package com.ywllab.nemo.dto.invitation

import com.ywllab.nemo.model.BaseColumn
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请码列表响应")
class InvitationCodePageResponse : BaseColumn() {
    @ApiModelProperty("ID")
    lateinit var invitationCodeId: String

    @ApiModelProperty("邀请码")
    var code: String = ""

    @ApiModelProperty("邀请人用户ID")
    var inviterId: String = ""

    @ApiModelProperty("使用次数")
    var usedCount: Int = 0

    @ApiModelProperty("邀请人用户名")
    var inviterUsername: String? = null

    @ApiModelProperty("邀请人邮箱")
    var inviterEmail: String? = null
}
