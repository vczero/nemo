package com.ywllab.nemo.dto.subscription

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.SubscriptionFeature
import com.ywllab.nemo.constant.SubscriptionPlanType
import com.ywllab.nemo.model.PricingRule
import com.ywllab.nemo.model.SubscriptionPlan
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("套餐DTO")
class SubscriptionPlanDto {
    @ApiModelProperty("套餐ID")
    var planId: String = ""

    @get:JsonProperty("id")
    val id: String
        get() = planId

    @ApiModelProperty("套餐编码")
    var planCode: String = ""

    @ApiModelProperty("套餐名称")
    var planName: String = ""

    @get:JsonProperty("name")
    val name: String
        get() = planName

    @ApiModelProperty("套餐描述")
    var planDescription: String? = null

    @ApiModelProperty("套餐类型")
    var planType: SubscriptionPlanType? = null

    @ApiModelProperty("月费价格")
    var monthlyPrice: Double = 0.0

    @ApiModelProperty("计费规则列表")
    var pricingRules: List<PricingRule>? = null

    @ApiModelProperty("功能特性列表")
    var features: List<SubscriptionFeature>? = null

    @ApiModelProperty("排序顺序")
    var sortOrder: Int = 0

    @ApiModelProperty("是否主推套餐")
    @JsonProperty("isRecommended")
    var isRecommended: Boolean = false

    @ApiModelProperty("是否启用")
    @JsonProperty("isActive")
    var isActive: Boolean = true

    constructor(plan: SubscriptionPlan) {
        this.planId = plan.planId
        this.planCode = plan.planCode
        this.planName = plan.planName
        this.planType = plan.planType
        this.planDescription = plan.planDescription
        this.monthlyPrice = plan.monthlyPrice
        this.pricingRules = plan.pricingRules
        this.features = plan.features
        this.sortOrder = plan.sortOrder
        this.isRecommended = plan.isRecommended
        this.isActive = plan.isActive
    }
}
