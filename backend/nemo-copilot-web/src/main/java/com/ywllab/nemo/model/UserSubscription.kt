package com.ywllab.nemo.model

import com.ywllab.nemo.constant.SubscriptionStatus
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户订阅")
class UserSubscription : BaseColumn() {
    @ApiModelProperty("订阅ID")
    lateinit var subscriptionId: String

    @ApiModelProperty("账户ID")
    lateinit var accountId: String

    @ApiModelProperty("套餐ID")
    lateinit var planId: String

    @ApiModelProperty("订阅开始时间")
    var startTime: Long = 0L

    @ApiModelProperty("订阅结束时间")
    var endTime: Long? = null

    @ApiModelProperty("状态")
    lateinit var status: SubscriptionStatus
}
