package com.ywllab.nemo.dto.account

import com.ywllab.nemo.constant.SubscriptionFeature
import com.ywllab.nemo.constant.SubscriptionPlanType
import com.ywllab.nemo.constant.SubscriptionStatus
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户订阅套餐情况")
class UserSubscriptionPlanDto {
    @ApiModelProperty("套餐ID")
    lateinit var planId: String

    @ApiModelProperty("套餐名称")
    lateinit var planName: String

    @ApiModelProperty("套餐描述")
    var planDescription: String = ""

    @ApiModelProperty("套餐类型")
    var planType: SubscriptionPlanType = SubscriptionPlanType.FREE

    @ApiModelProperty("功能特性列表")
    var features: List<SubscriptionFeature> = emptyList()

    @ApiModelProperty("订阅到期时间")
    var subscriptionEndTime: Long? = null

    @ApiModelProperty("订阅状态")
    var subscriptionStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE
}
