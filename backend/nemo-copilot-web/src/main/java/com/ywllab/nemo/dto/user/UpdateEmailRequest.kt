package com.ywllab.nemo.dto.user

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import javax.validation.constraints.NotBlank

@ApiModel("修改邮箱请求")
class UpdateEmailRequest {

    @ApiModelProperty("新邮箱", required = true)
    @NotBlank(message = "新邮箱不能为空")
    var newEmail: String = ""

    @ApiModelProperty("验证码", required = true)
    @NotBlank(message = "验证码不能为空")
    var verifyCode: String = ""
}
