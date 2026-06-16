package com.ywllab.nemo.dto.user

import io.swagger.annotations.ApiModelProperty

class LoginParam {
    @ApiModelProperty("用户名/邮箱/手机号", required = true)
    lateinit var username: String

    @ApiModelProperty("密码（密码登录时必填）")
    var password: String? = null

    @ApiModelProperty("验证码（验证码登录时必填）")
    var verifyCode: String? = null

    @ApiModelProperty("用户协议ID")
    var agreementIds: List<String> = listOf()
}
