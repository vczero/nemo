package com.ywllab.nemo.dto.subscription

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.ProductType
import com.ywllab.nemo.model.Product
import com.ywllab.nemo.model.SubscriptionPlan
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订单快照")
class OrderSnapshot {

    @ApiModelProperty("产品信息")
    @JsonProperty("product")
    var product: ProductInfo? = null

    @ApiModelProperty("套餐信息")
    var plan: PlanInfo? = null

    @ApiModelProperty("套餐产品列表（当购买套餐时有值）")
    var planProducts: List<ProductInfo> = listOf()

    constructor()
    constructor(plan: SubscriptionPlan, subscribeMonth: Int, planProducts: List<Product>) {
        this.plan = PlanInfo().apply {
            this.planId = plan.planId
            this.planCode = plan.planCode
            this.planName = plan.planName
            this.planDescription = plan.planDescription
            this.monthlyPrice = plan.monthlyPrice
            this.subscribeMonth = subscribeMonth
        }
        this.planProducts = planProducts.map { p ->
            ProductInfo().apply {
                this.productId = p.productId
                this.productCode = p.productCode
                this.productName = p.productName
                this.productType = p.productType
                this.subscriptionPlanId = p.subscriptionPlanId
                this.subscriptionMonths = p.subscriptionMonths
                this.tokenAmount = p.tokenAmount
                this.originalPrice = p.originalPrice
                this.currentPrice = p.currentPrice
            }
        }
    }

    constructor(product: Product) {
        this.product = ProductInfo().apply {
            this.productId = product.productId
            this.productCode = product.productCode
            this.productName = product.productName
            this.productType = product.productType
            this.subscriptionPlanId = product.subscriptionPlanId
            this.subscriptionMonths = product.subscriptionMonths
            this.tokenAmount = product.tokenAmount
            this.originalPrice = product.originalPrice
            this.currentPrice = product.currentPrice
        }
    }
}

@ApiModel("产品信息")
class ProductInfo {

    @ApiModelProperty("产品ID")
    var productId: String = ""

    @ApiModelProperty("产品编码")
    var productCode: String = ""

    @ApiModelProperty("产品名称")
    var productName: String = ""

    @ApiModelProperty("产品类型")
    var productType: ProductType? = null

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
}

@ApiModel("套餐信息")
class PlanInfo {

    @ApiModelProperty("套餐ID")
    var planId: String = ""

    @ApiModelProperty("套餐编码")
    var planCode: String = ""

    @ApiModelProperty("套餐名称")
    var planName: String = ""

    @ApiModelProperty("套餐描述")
    var planDescription: String? = null

    @ApiModelProperty("月费价格")
    var monthlyPrice: Double = 0.0

    @ApiModelProperty("订阅月数")
    var subscribeMonth: Int = 0
}
