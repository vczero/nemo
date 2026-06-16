package com.ywllab.nemo.dto.subscription

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订单金额计算结果")
class OrderCalculateResult {

    @ApiModelProperty("产品价格")
    var productPrice: Double = 0.0

    @ApiModelProperty("抵扣积分")
    var deductPoint: Int = 0

    @ApiModelProperty("折扣金额")
    var discountAmount: Double = 0.0

    @ApiModelProperty("最终金额")
    var amount: Double = 0.0
}
