package com.ywllab.nemo.dto.subscription.boss

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订单用户DTO")
class OrderUserDto {
    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("用户名")
    var username: String = ""

    @ApiModelProperty("昵称")
    var nickname: String? = null

    @ApiModelProperty("头像URL")
    var avatarUrl: String? = null

    @ApiModelProperty("邮箱")
    var email: String? = null

    @ApiModelProperty("手机号")
    var phone: String? = null

    companion object {
        fun from(user: com.ywllab.nemo.model.User): OrderUserDto {
            return OrderUserDto().apply {
                this.userId = user.userId
                this.username = user.username
                this.nickname = user.nickname
                this.avatarUrl = user.avatarUrl
                this.email = user.email
                this.phone = user.phone
            }
        }
    }
}
