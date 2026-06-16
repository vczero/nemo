package com.ywllab.nemo.dto.user

import io.swagger.annotations.ApiModelProperty

class ChangePasswordByPasswordRequest {

    @ApiModelProperty("旧密码", required = true)
    lateinit var oldPassword: String

    @ApiModelProperty("新密码", required = true)
    lateinit var newPassword: String
}

class ChangePasswordByCodeRequest {

    @ApiModelProperty("邮箱", required = true)
    var email: String = ""

    @ApiModelProperty("邮箱验证码", required = true)
    lateinit var verifyCode: String

    @ApiModelProperty("新密码", required = true)
    lateinit var newPassword: String
}
