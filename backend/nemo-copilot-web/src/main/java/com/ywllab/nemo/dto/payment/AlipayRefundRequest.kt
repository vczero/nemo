package com.ywllab.nemo.dto.payment

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("支付宝退款请求")
class AlipayRefundRequest {

    @ApiModelProperty("商户订单号", required = true)
    lateinit var outTradeNo: String

    @ApiModelProperty("退款金额", required = true)
    var refundAmount: Double = 0.0

    @ApiModelProperty("退款请求号", required = true)
    lateinit var outRequestNo: String
}
