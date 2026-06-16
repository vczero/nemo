package com.ywllab.nemo.dto.payment

import io.swagger.annotations.ApiModel

@ApiModel("支付宝交易查询结果")
class AlipayTradeQueryResult {

    var success: Boolean = false

    var outTradeNo: String = ""

    var tradeNo: String = ""

    var tradeStatus: String = ""

    var totalAmount: Double = 0.0

    var buyerPayAmount: Double = 0.0
}
