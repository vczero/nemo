package com.ywllab.nemo.dto.web

import com.ywllab.nemo.constant.VerificationCodeType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("验证码校验请求")
class VerifyCodeRequest {

    @ApiModelProperty("邮箱")
    var email: String = ""

    @ApiModelProperty("验证码")
    var code: String = ""

    @ApiModelProperty("验证码类型")
    lateinit var type: VerificationCodeType
}
