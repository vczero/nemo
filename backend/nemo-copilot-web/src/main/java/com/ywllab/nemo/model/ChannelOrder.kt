package com.ywllab.nemo.model

import com.ywllab.nemo.constant.ChannelOrderStatus
import com.ywllab.nemo.constant.ChannelOrderType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.math.BigDecimal

@ApiModel("渠道订单")
class ChannelOrder : BaseColumn() {

    @ApiModelProperty("订单ID")
    lateinit var orderId: String

    @ApiModelProperty("渠道名称")
    lateinit var channelName: String

    @ApiModelProperty("渠道订单号")
    var channelOrderNo: String? = null

    @ApiModelProperty("渠道供货价")
    var channelOrderAmount: BigDecimal = BigDecimal.ZERO

    @ApiModelProperty("渠道订单状态")
    lateinit var status: ChannelOrderStatus

    @ApiModelProperty("渠道订单类型")
    lateinit var channelOrderType: ChannelOrderType

    @ApiModelProperty("用户邮箱")
    lateinit var email: String

    @ApiModelProperty("订阅套餐ID")
    lateinit var subscriptionPlanId: String

    @ApiModelProperty("订阅月数")
    var subscriptionMonths: Int = 0

    @ApiModelProperty("渠道发放时间")
    var channelGrantTime: Long = 0L

    @ApiModelProperty("用户激活时间")
    var userActivationTime: Long? = null
}
