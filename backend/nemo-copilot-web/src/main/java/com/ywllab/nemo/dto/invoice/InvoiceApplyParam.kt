package com.ywllab.nemo.dto.invoice

import com.ywllab.nemo.constant.InvoiceType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

/**
 * 发票开具请求
 */
@ApiModel("发票开具请求")
class InvoiceApplyParam : Serializable {
    @ApiModelProperty("发票类型", required = true)
    lateinit var invoiceType: InvoiceType

    @ApiModelProperty("发票抬头", required = true)
    lateinit var title: String

    @ApiModelProperty("开票金额", required = true)
    var amount: Double = 0.0

    @ApiModelProperty("社会统一信用代码(企业发票必填)")
    var creditCode: String? = null

    @ApiModelProperty("接收邮箱", required = true)
    lateinit var email: String

    @ApiModelProperty("备注")
    var remark: String? = null
}
