package com.ywllab.nemo.dto.invitation

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("邀请码响应")
class InvitationCodeResponse {
    @ApiModelProperty("邀请码")
    lateinit var code: String
}
