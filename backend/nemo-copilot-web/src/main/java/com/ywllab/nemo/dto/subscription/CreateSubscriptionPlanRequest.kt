package com.ywllab.nemo.dto.subscription

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.SubscriptionFeature
import com.ywllab.nemo.constant.SubscriptionPlanType
import com.ywllab.nemo.model.PricingRule
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull

@ApiModel("创建套餐请求")
class CreateSubscriptionPlanRequest {
    @ApiModelProperty("套餐编码", required = true)
    @NotBlank(message = "套餐编码不能为空")
    var planCode: String = ""

    @ApiModelProperty("套餐名称", required = true)
    @NotBlank(message = "套餐名称不能为空")
    var planName: String = ""

    @ApiModelProperty("套餐描述")
    var planDescription: String? = null

    @ApiModelProperty("套餐类型", required = true)
    @NotNull(message = "套餐类型不能为空")
    var planType: SubscriptionPlanType? = null

    @ApiModelProperty("月费价格", required = true)
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
