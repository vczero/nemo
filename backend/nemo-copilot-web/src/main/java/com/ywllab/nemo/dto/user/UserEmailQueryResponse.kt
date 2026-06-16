package com.ywllab.nemo.dto.user

import com.ywllab.nemo.constant.SubscriptionStatus
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("根据邮箱查询用户响应")
class UserEmailQueryResponse {
    @ApiModelProperty("用户是否存在")
    var exists: Boolean = false

    @ApiModelProperty("用户名")
    var username: String? = null

    @ApiModelProperty("用户昵称")
    var nickname: String? = null

    @ApiModelProperty("套餐到期时间")
    var subscriptionEndTime: Long? = null

    @ApiModelProperty("订阅状态")
    var subscriptionStatus: SubscriptionStatus = SubscriptionStatus.NONE
}
