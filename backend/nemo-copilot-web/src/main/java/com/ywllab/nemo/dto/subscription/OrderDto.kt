package com.ywllab.nemo.dto.subscription

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.constant.TokenPackStatus
import com.ywllab.nemo.dto.subscription.boss.OrderUserDto
import com.ywllab.nemo.model.Order
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订单DTO")
class OrderDto {
    @ApiModelProperty("订单ID")
    var orderId: String = ""

    @ApiModelProperty("订单编号")
    var orderNo: String = ""

    @ApiModelProperty("账户ID")
    var accountId: String = ""

    @ApiModelProperty("用户信息")
    var user: OrderUserDto? = null

    @ApiModelProperty("产品ID")
    var productId: String = ""

    @ApiModelProperty("套餐ID")
    var subscriptionPlanId: String? = null

    @ApiModelProperty("订单产品快照")
    var orderSnapshot: String? = null

    @ApiModelProperty("产品名称")
    var productName: String? = null

    @ApiModelProperty("产品详情链接")
    var productLink: String? = null

    @ApiModelProperty("套餐名称")
    var planName: String? = null

    @ApiModelProperty("套餐详情链接")
    var planLink: String? = null

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
    lateinit var status: OrderStatus

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
        fun from(order: Order, user: OrderUserDto? = null): OrderDto {
            val snapshot = if (order.productSnapshot.isNotBlank()) {
                try {
                    JSONUtil.toBean(order.productSnapshot, OrderSnapshot::class.java)
                } catch (e: Exception) {
                    null
                }
            } else {
                null
            }

            val productName = snapshot?.product?.productName
            val planName = snapshot?.plan?.planName
            val productLink = if (order.productId.isNotBlank()) "/product/${order.productId}" else null
            val planLink = order.subscriptionPlanId?.let { "/plan/$it" }
            return OrderDto().apply {
                // 渠道订单(2B)的金额不显示
                this.originalAmount = order.originalAmount
                this.discountAmount = order.discountAmount
                this.pointsDeductAmount = order.pointsDeductAmount
                this.pointsUsed = order.pointsUsed
                this.payAmount = order.payAmount
                this.orderId = order.orderId
                this.orderNo = order.orderNo
                this.accountId = order.accountId
                this.productId = order.productId
                this.subscriptionPlanId = order.subscriptionPlanId
                this.orderSnapshot = order.productSnapshot
                this.productName = productName
                this.planName = planName
                this.productLink = productLink
                this.planLink = planLink
                this.quantity = order.quantity
                this.status = order.status
                this.payMethod = order.payMethod
                this.paidTime = order.paidTime
                this.expireTime = order.expireTime
                this.remark = order.remark
                this.createTime = order.createTime
                this.user = user
                this.tokenRemainingAmount = order.tokenRemainingAmount
                this.tokenPackStatus = order.tokenPackStatus
            }
        }
    }
}
