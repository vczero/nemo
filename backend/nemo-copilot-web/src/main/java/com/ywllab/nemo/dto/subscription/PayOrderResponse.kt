package com.ywllab.nemo.dto.subscription

import com.ywllab.nemo.constant.PayMethod
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("支付订单响应")
class PayOrderResponse {
    @ApiModelProperty("订单ID")
    var orderId: String = ""

    @ApiModelProperty("支付方式")
    var payMethod: String? = null

    @ApiModelProperty("支付表单HTML（需要前端展示以跳转支付页面）")
    var payFormHtml: String? = null

    companion object {
        fun from(orderId: String, payMethod: PayMethod, payFormHtml: String? = null): PayOrderResponse {
            return PayOrderResponse().apply {
                this.orderId = orderId
                this.payMethod = payMethod.name
                this.payFormHtml = payFormHtml
            }
        }
    }
}
