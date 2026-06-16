package com.ywllab.nemo.dto.invoice

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

/**
 * 可开票金额信息
 */
@ApiModel("可开票金额信息")
class AvailableInvoiceAmountDTO : Serializable {
    @ApiModelProperty("已支付订单总金额")
    var totalPaidAmount: Double = 0.0

    @ApiModelProperty("已开票金额")
    var totalInvoicedAmount: Double = 0.0

    @ApiModelProperty("可开票金额")
    var availableAmount: Double = 0.0
}
