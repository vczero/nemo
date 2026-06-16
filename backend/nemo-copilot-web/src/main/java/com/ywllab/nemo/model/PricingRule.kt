package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计费规则")
class PricingRule {
    @ApiModelProperty("订阅月数")
    var months: Int = 0

    @ApiModelProperty("折扣率，如0.888表示88.8折")
    var discount: Double = 1.0

    @ApiModelProperty("规则名称，如'年费优惠'")
    var name: String? = null
}
