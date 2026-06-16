package com.ywllab.nemo.dto.channel

import com.ywllab.nemo.constant.ChannelOrderStatus
import com.ywllab.nemo.constant.ChannelOrderType
import com.ywllab.nemo.model.ChannelOrder
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.math.BigDecimal

@ApiModel("渠道订单响应")
class ChannelOrderResponse {

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
    var subscriptionPlanId: String? = null

    @ApiModelProperty("订阅月数")
    var subscriptionMonths: Int = 0

    @ApiModelProperty("渠道发放时间")
    var channelGrantTime: Long? = null

    @ApiModelProperty("用户激活时间")
    var userActivationTime: Long? = null

    @ApiModelProperty("创建人")
    var createBy: String? = null

    @ApiModelProperty("创建人名称")
    var creatorName: String? = null

    companion object {
        fun from(channelOrder: ChannelOrder): ChannelOrderResponse {
            return ChannelOrderResponse().apply {
                this.orderId = channelOrder.orderId
                this.channelName = channelOrder.channelName
                this.channelOrderNo = channelOrder.channelOrderNo
                this.channelOrderAmount = channelOrder.channelOrderAmount
                this.status = channelOrder.status
                this.channelOrderType = channelOrder.channelOrderType
                this.email = channelOrder.email
                this.subscriptionPlanId = channelOrder.subscriptionPlanId
                this.subscriptionMonths = channelOrder.subscriptionMonths
                this.channelGrantTime = channelOrder.channelGrantTime
                this.userActivationTime = channelOrder.userActivationTime
                this.createBy = channelOrder.createBy
            }
        }
    }
}
