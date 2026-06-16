package com.ywllab.nemo.dto.channel

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.math.BigDecimal

@ApiModel("创建渠道订单请求")
class ChannelOrderCreateRequest {

    @ApiModelProperty("渠道名称")
    lateinit var channelName: String

    @ApiModelProperty("渠道订单号")
    var channelOrderNo: String? = null

    @ApiModelProperty("渠道供货价", required = true)
    var channelOrderAmount: BigDecimal? = null

    @ApiModelProperty("用户邮箱")
    lateinit var email: String

    @ApiModelProperty("订阅套餐ID", required = true)
    lateinit var subscriptionPlanId: String

    @ApiModelProperty("订阅月数", required = true)
    var subscriptionMonths: Int = 0

    @ApiModelProperty("渠道发放时间")
    var channelGrantTime: Long? = null
}
