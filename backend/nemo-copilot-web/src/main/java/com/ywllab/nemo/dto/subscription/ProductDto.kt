package com.ywllab.nemo.dto.subscription

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.ProductType
import com.ywllab.nemo.model.Product
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("产品DTO")
class ProductDto {
    @ApiModelProperty("产品ID")
    var productId: String = ""

    @ApiModelProperty("产品编码")
    var productCode: String = ""

    @ApiModelProperty("产品名称")
    var productName: String = ""

    @ApiModelProperty("产品类型")
    lateinit var productType: ProductType

    @ApiModelProperty("关联套餐ID")
    var subscriptionPlanId: String? = null

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

    constructor()

    constructor(product: Product) {
        this.productId = product.productId
        this.productCode = product.productCode
        this.productName = product.productName
        this.productType = product.productType
        this.subscriptionPlanId = product.subscriptionPlanId
        this.subscriptionMonths = product.subscriptionMonths
        this.tokenAmount = product.tokenAmount
        this.originalPrice = product.originalPrice
        this.currentPrice = product.currentPrice
        this.pointsDeductEnabled = product.pointsDeductEnabled
        this.maxPointsDeduct = product.maxPointsDeduct
        this.sortOrder = product.sortOrder
        this.isActive = product.isActive
    }
}
