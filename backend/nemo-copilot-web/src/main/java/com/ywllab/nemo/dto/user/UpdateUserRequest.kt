package com.ywllab.nemo.dto.user

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import javax.validation.constraints.Size

@ApiModel("更新用户信息请求")
class UpdateUserRequest {

    @ApiModelProperty("昵称", required = false)
    @Size(max = 50, message = "昵称长度不能超过50个字符")
    var nickname: String? = null

    @ApiModelProperty("机构/学校", required = false)
    @Size(max = 190, message = "机构名称长度不能超过190个字符")
    var organization: String? = null
}
