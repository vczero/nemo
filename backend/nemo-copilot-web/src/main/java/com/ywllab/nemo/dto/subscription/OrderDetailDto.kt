package com.ywllab.nemo.dto.subscription

import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.constant.TokenPackStatus
import com.ywllab.nemo.dto.subscription.boss.OrderUserDto
import com.ywllab.nemo.model.Order
import com.ywllab.nemo.model.Product
import com.ywllab.nemo.model.SubscriptionPlan
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订单详情DTO")
class OrderDetailDto {
    @ApiModelProperty("订单ID")
    var orderId: String = ""

    @ApiModelProperty("订单编号")
    var orderNo: String = ""

    @ApiModelProperty("账户ID")
    var accountId: String = ""

    @ApiModelProperty("用户信息")
    var user: OrderUserDto? = null

    @ApiModelProperty("产品信息")
    var productDto: ProductDto? = null

    @ApiModelProperty("套餐信息")
    var subscriptionPlanDto: SubscriptionPlanDto? = null

    @ApiModelProperty("购买数量")
    var quantity: Int = 1

    @ApiModelProperty("原价总额")
    var originalAmount: Double = 0.0

    @ApiModelProperty("优惠金额")
    var discountAmount: Double = 0.0

    @ApiModelProperty("积分抵扣金额")
    var pointsDeductAmount: Double = 0.0

    @ApiModelProperty("使用积分数量")
    var pointsUsed: Int = 0

    @ApiModelProperty("实付金额")
    var payAmount: Double = 0.0

    @ApiModelProperty("订单状态")
    var status: OrderStatus = OrderStatus.UN_PAY

    @ApiModelProperty("订单状态描述")
    var statusDescription: String = ""
        get() = status.description

    @ApiModelProperty("支付方式")
    var payMethod: PayMethod? = null

    @ApiModelProperty("支付方式描述")
    var payMethodDescription: String? = null
        get() = payMethod?.description

    @ApiModelProperty("支付时间")
    var paidTime: Long? = null

    @ApiModelProperty("订单过期时间")
    var expireTime: Long = 0L

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    // 流量包订单的动态数据
    @ApiModelProperty("流量包剩余数量（仅流量包订单）")
    var tokenRemainingAmount: Long = 0L

    @ApiModelProperty("流量包状态（仅流量包订单）")
    var tokenPackStatus: TokenPackStatus? = null

    companion object {
        fun from(
            order: Order,
            product: Product? = null,
            subscriptionPlan: SubscriptionPlan? = null
        ): OrderDetailDto {
            val productDto = product?.let { ProductDto(it) }
            val subscriptionPlanDto = subscriptionPlan?.let { SubscriptionPlanDto(it) }

            return OrderDetailDto().apply {
                this.orderId = order.orderId
                this.orderNo = order.orderNo
                this.accountId = order.accountId
                this.productDto = productDto
                this.subscriptionPlanDto = subscriptionPlanDto
                this.quantity = order.quantity
                this.originalAmount = order.originalAmount
                this.discountAmount = order.discountAmount
                this.pointsDeductAmount = order.pointsDeductAmount
                this.pointsUsed = order.pointsUsed
                this.payAmount = order.payAmount
                this.status = order.status
                this.payMethod = order.payMethod
                this.paidTime = order.paidTime
                this.expireTime = order.expireTime
                this.remark = order.remark
                this.createTime = order.createTime
                this.tokenRemainingAmount = order.tokenRemainingAmount
                this.tokenPackStatus = order.tokenPackStatus
            }
        }
    }
}
