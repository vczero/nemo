package com.ywllab.nemo.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.SubscriptionFeature
import com.ywllab.nemo.constant.SubscriptionPlanType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订阅套餐")
class SubscriptionPlan : BaseColumn() {
    @ApiModelProperty("套餐ID")
    lateinit var planId: String

    @ApiModelProperty("套餐编码")
    lateinit var planCode: String

    @ApiModelProperty("套餐名称")
    lateinit var planName: String

    @ApiModelProperty("套餐描述")
    var planDescription: String? = null

    @ApiModelProperty("套餐类型")
    var planType: SubscriptionPlanType? = null

    @ApiModelProperty("月费价格")
    var monthlyPrice: Double = 0.0

    @ApiModelProperty("计费规则列表")
    var pricingRules: List<PricingRule> = listOf()

    @ApiModelProperty("功能特性列表")
    var features: List<SubscriptionFeature> = listOf()

    @ApiModelProperty("排序顺序")
    var sortOrder: Int = 0

    @ApiModelProperty("是否主推套餐")
    @JsonProperty("isRecommended")
    var isRecommended: Boolean = false

    @ApiModelProperty("是否启用")
    @JsonProperty("isActive")
    var isActive: Boolean = true
}
