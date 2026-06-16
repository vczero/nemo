package com.ywllab.nemo.dto.subscription

import com.ywllab.nemo.constant.PayMethod
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("支付订单请求")
class PayOrderRequest {
    @ApiModelProperty("支付方式", required = true)
    lateinit var payMethod: PayMethod

    @ApiModelProperty("支付二维码宽度", required = false)
    var payQrCodeWidth: Int = 300
}
