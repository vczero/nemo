package com.ywllab.nemo.dto.payment

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("支付宝订单创建请求")
class AlipayOrderBizModel {

    @ApiModelProperty("商户订单号", required = true)
    lateinit var outTradeNo: String

    @ApiModelProperty("订单金额", required = true)
    var totalAmount: Double = 0.0

    @ApiModelProperty("订单标题", required = true)
    lateinit var subject: String

    @ApiModelProperty("订单描述")
    var body: String? = null

    @ApiModelProperty("超时时间")
    var timeoutExpress: String = "30m"

    @ApiModelProperty("产品码")
    var productCode: String = "FAST_INSTANT_TRADE_PAY"
}
