package com.ywllab.nemo.dto.web

import com.ywllab.nemo.constant.VerificationCodeType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("验证码发送请求")
class SendCodeRequest {
    @ApiModelProperty("邮箱")
    lateinit var email: String

    @ApiModelProperty("验证码类型")
    lateinit var type: VerificationCodeType
}
