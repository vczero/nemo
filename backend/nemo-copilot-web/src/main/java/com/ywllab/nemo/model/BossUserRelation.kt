package com.ywllab.nemo.model

import com.ywllab.nemo.constant.BossUserType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("Boss用户关联")
class BossUserRelation {
    @ApiModelProperty("用户ID（主键）")
    lateinit var userId: String

    @ApiModelProperty("用户类型：ADMIN-管理员 EDIT-编辑 READ-只读")
    var userType: BossUserType = BossUserType.READ

    @ApiModelProperty("创建人")
    var createBy: String = ""

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("用户名")
    var username: String? = null

    @ApiModelProperty("邮箱")
    var email: String? = null
}
