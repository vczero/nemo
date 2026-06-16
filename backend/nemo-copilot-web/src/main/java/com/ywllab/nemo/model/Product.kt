package com.ywllab.nemo.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.ProductType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("产品")
class Product : BaseColumn() {
    @ApiModelProperty("产品ID")
    lateinit var productId: String

    @ApiModelProperty("产品编码")
    lateinit var productCode: String

    @ApiModelProperty("产品名称")
    lateinit var productName: String

    @ApiModelProperty("产品类型")
    lateinit var productType: ProductType

    @ApiModelProperty("关联套餐ID")
    var subscriptionPlanId: String? = null

    @ApiModelProperty("订阅月数")
    var subscriptionMonths: Int? = null

    @ApiModelProperty("Token数量")
    var tokenAmount: Double? = null

    @ApiModelProperty("有效期天数（流量包专用）")
    var validityDays: Int? = null

    @ApiModelProperty("原价")
    var originalPrice: Double = 0.0

    @ApiModelProperty("现价")
    var currentPrice: Double = 0.0

    @ApiModelProperty("是否支持积分抵扣")
    @JsonProperty("pointsDeductEnabled")
    var pointsDeductEnabled: Boolean = true

    @ApiModelProperty("最大积分抵扣数量")
    var maxPointsDeduct: Int? = null

    @ApiModelProperty("排序")
    var sortOrder: Int = 0

    @ApiModelProperty("是否上架")
    @JsonProperty("isActive")
    var isActive: Boolean = true
}
