package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户")
class User : BaseColumn() {
    @ApiModelProperty("ID")
    lateinit var userId: String

    @ApiModelProperty("用户名")
    var username: String = ""

    @ApiModelProperty("密码")
    var password: String = ""

    @ApiModelProperty("昵称")
    var nickname: String? = null

    @ApiModelProperty("头像URL")
    var avatarUrl: String? = null

    @ApiModelProperty("邮箱")
    var email: String = ""

    @ApiModelProperty("手机号")
    var phone: String? = null

    @ApiModelProperty("注册IP")
    var registerIp: String? = null

    @ApiModelProperty("最后登录IP")
    var lastLoginIp: String? = null

    @ApiModelProperty("最后登录时间")
    var lastLoginTime: Long? = null

    @ApiModelProperty("状态")
    var status: String = "ACTIVE"

    @ApiModelProperty("是否锁定：0-未锁定 1-已锁定")
    var isLocked: Int = 0
}
