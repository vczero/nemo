package com.ywllab.nemo.model

import com.ywllab.nemo.constant.InvoiceStatus
import com.ywllab.nemo.constant.InvoiceType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("发票")
class Invoice : BaseColumn() {
    @ApiModelProperty("发票ID")
    lateinit var invoiceId: String

    @ApiModelProperty("发票编号")
    lateinit var invoiceNo: String

    @ApiModelProperty("用户ID")
    lateinit var userId: String

    @ApiModelProperty("发票类型")
    lateinit var invoiceType: InvoiceType

    @ApiModelProperty("发票抬头")
    lateinit var title: String

    @ApiModelProperty("开票金额")
    var amount: Double = 0.0

    @ApiModelProperty("社会统一信用代码(企业发票)")
    var creditCode: String? = null

    @ApiModelProperty("接收邮箱")
    lateinit var email: String

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("发票状态")
    var status: InvoiceStatus = InvoiceStatus.PENDING

    @ApiModelProperty("拒绝原因")
    var rejectReason: String? = null

    @ApiModelProperty("发票文件URL")
    var invoiceFileUrl: String? = null

    @ApiModelProperty("申请时间")
    var applyTime: Long = 0L

    @ApiModelProperty("开具时间")
    var issueTime: Long? = null
}
