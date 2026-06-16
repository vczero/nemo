package com.ywllab.nemo.dto.subscription

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.constant.OrderSource
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.model.Order
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订阅订单DTO")
class SubscriptionOrderDto {
    @ApiModelProperty("订单ID")
    var orderId: String = ""

    @ApiModelProperty("订单编号")
    var orderNo: String = ""

    @ApiModelProperty("套餐ID")
    var subscriptionPlanId: String? = null

    @ApiModelProperty("套餐名称")
    var planName: String? = null

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

    @ApiModelProperty("支付方式")
    var payMethod: PayMethod? = null

    @ApiModelProperty("支付时间")
    var paidTime: Long? = null

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("订阅开始时间")
    var subscriptionStartTime: Long? = null

    @ApiModelProperty("订阅到期时间")
    var subscriptionEndTime: Long? = null

    @ApiModelProperty("订阅月数")
    var subscriptionMonths: Int? = null

    companion object {
        fun from(order: Order): SubscriptionOrderDto {
            val snapshot = if (order.productSnapshot.isNotBlank()) {
                try {
                    JSONUtil.toBean(order.productSnapshot, OrderSnapshot::class.java)
                } catch (e: Exception) {
                    null
                }
            } else {
                null
            }

            val planName = snapshot?.plan?.planName
            return SubscriptionOrderDto().apply {
                this.orderId = order.orderId
                this.orderNo = order.orderNo
                this.subscriptionPlanId = order.subscriptionPlanId
                this.planName = planName
                // 渠道订单(2B)的金额不显示
                if (order.source == OrderSource.TO_B) {
                    this.originalAmount = 0.0
                    this.discountAmount = 0.0
                    this.pointsDeductAmount = 0.0
                    this.pointsUsed = 0
                    this.payAmount = 0.0
                } else {
                    this.originalAmount = order.originalAmount
                    this.discountAmount = order.discountAmount
                    this.pointsDeductAmount = order.pointsDeductAmount
                    this.pointsUsed = order.pointsUsed
                    this.payAmount = order.payAmount
                }
                this.payMethod = order.payMethod
                this.paidTime = order.paidTime
                this.remark = order.remark
                this.createTime = order.createTime

                this.subscriptionStartTime = order.paidTime
                this.subscriptionEndTime = order.subscriptionPlanEndTime
                this.subscriptionMonths = snapshot?.plan?.subscribeMonth
            }
        }
    }
}
