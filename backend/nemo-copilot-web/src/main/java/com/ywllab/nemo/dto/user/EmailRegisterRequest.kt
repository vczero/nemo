package com.ywllab.nemo.dto.user

import io.swagger.annotations.ApiModelProperty

class EmailRegisterRequest {
    @ApiModelProperty("邮箱", required = true)
    lateinit var email: String

    @ApiModelProperty("密码")
    var password: String = ""

    @ApiModelProperty("昵称")
    var nickname: String? = null

    @ApiModelProperty("验证码")
    var verifyCode: String = ""

    @ApiModelProperty("邀请码")
    var inviteCode: String? = null

    @ApiModelProperty("用户协议ID")
    var agreementIds: List<String> = listOf()
}
