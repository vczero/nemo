package com.ywllab.nemo.dto.subscription

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订阅费用计算结果")
class CalculateResult {

    @ApiModelProperty("月订阅价格")
    var monthlyPrice: Double = 0.0

    @ApiModelProperty("月数")
    var subscribeMonth: Int = 0

    @ApiModelProperty("用户积分余额")
    var pointsBalance: Int = 0

    @ApiModelProperty("本年已抵扣积分")
    var annualDeductedPoint: Int = 0

    @ApiModelProperty("可抵扣积分")
    var deductPoint: Int = 0

    @ApiModelProperty("积分可抵扣金额")
    var pointDeductAmount: Double = 0.0

    @ApiModelProperty("折扣，比如包年0.88折")
    var discount: Double = 0.0

    @ApiModelProperty("原始金额")
    var originAmount: Double = 0.0

    @ApiModelProperty("折扣金额")
    var discountAmount: Double = 0.0

    @ApiModelProperty("折后金额")
    var discountedAmount: Double = 0.0

    @ApiModelProperty("最终金额")
    var amount: Double = 0.0
}
