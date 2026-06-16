package com.ywllab.nemo.dto.subscription

import com.ywllab.nemo.constant.PayMethod
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("创建订单请求")
class CreateOrderRequest {
    @ApiModelProperty("套餐ID，当产品ID为空时必填")
    var planId: String = ""

    @ApiModelProperty("产品ID，当套餐ID为空时必填")
    var productId: String = ""

    @ApiModelProperty("订阅月数，套餐订单必填")
    var subscribeMonth: Int? = null

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("支付方式", required = true)
    lateinit var payMethod: PayMethod

    @ApiModelProperty("支付二维码宽度", required = false)
    var payQrCodeWidth: Int = 300
}
