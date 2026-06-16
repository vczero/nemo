package com.ywllab.nemo.model

import cn.hutool.core.date.DateUtil
import com.ywllab.nemo.constant.OrderSource
import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.constant.TokenPackStatus
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.util.Date

@ApiModel("订单")
class Order : BaseColumn() {
    @ApiModelProperty("订单ID")
    lateinit var orderId: String

    @ApiModelProperty("订单编号")
    lateinit var orderNo: String

    @ApiModelProperty("账户ID")
    lateinit var accountId: String

    @ApiModelProperty("产品ID")
    var productId: String = ""

    @ApiModelProperty("套餐ID")
    var subscriptionPlanId: String? = null

    @ApiModelProperty("订单产品快照")
    lateinit var productSnapshot: String

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

    @ApiModelProperty("支付方式")
    var payMethod: PayMethod? = null

    @ApiModelProperty("支付时间")
    var paidTime: Long? = null

    @ApiModelProperty("订单过期时间")
    var expireTime: Long = 0L

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("订单来源")
    lateinit var source: OrderSource

    // 流量包订单的动态数据
    @ApiModelProperty("流量包剩余数量（仅流量包订单）")
    var tokenRemainingAmount: Long = 0L

    @ApiModelProperty("流量包状态（仅流量包订单）")
    var tokenPackStatus: TokenPackStatus? = null

    // 动态计算套餐到期时间：支付时间+订阅月数
    val subscriptionPlanEndTime
        get() = if (subscriptionPlanId != null) {
            paidTime?.let {
                DateUtil.offsetMonth(Date(it), quantity).toJdkDate().time
            }
        } else {
            null
        }
}
