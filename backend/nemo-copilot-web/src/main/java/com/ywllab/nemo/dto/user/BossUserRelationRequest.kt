package com.ywllab.nemo.dto.user

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("Boss用户关联请求")
class BossUserRelationRequest {
    @ApiModelProperty("用户ID", required = true)
    lateinit var userId: String

    @ApiModelProperty("用户类型：admin-管理员 edit-编辑 read-只读", required = true)
    lateinit var userType: String
}
