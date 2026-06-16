package com.ywllab.nemo.dto.subscription

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("更新产品请求")
class UpdateProductRequest {
    @ApiModelProperty("产品名称")
    var productName: String = ""

    @ApiModelProperty("订阅月数")
    var subscriptionMonths: Int? = null

    @ApiModelProperty("Token数量")
    var tokenAmount: Double? = null

    @ApiModelProperty("原价")
    var originalPrice: Double = 0.0

    @ApiModelProperty("现价")
    var currentPrice: Double = 0.0

    @ApiModelProperty("是否支持积分抵扣")
    var pointsDeductEnabled: Boolean = true

    @ApiModelProperty("最大积分抵扣数量")
    var maxPointsDeduct: Int? = null

    @ApiModelProperty("排序")
    var sortOrder: Int = 0

    @ApiModelProperty("是否上架")
    @JsonProperty("isActive")
    var isActive: Boolean = true
}
