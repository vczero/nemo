package com.ywllab.nemo.dto.invoice

import com.ywllab.nemo.constant.InvoiceStatus
import com.ywllab.nemo.constant.InvoiceType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

/**
 * 发票DTO
 */
@ApiModel("发票信息")
class InvoiceDTO : Serializable {
    @ApiModelProperty("发票ID")
    lateinit var invoiceId: String

    @ApiModelProperty("发票编号")
    lateinit var invoiceNo: String

    @ApiModelProperty("发票类型")
    lateinit var invoiceType: InvoiceType

    @ApiModelProperty("发票类型描述")
    lateinit var invoiceTypeDescription: String

    @ApiModelProperty("发票抬头")
    lateinit var title: String

    @ApiModelProperty("开票金额")
    var amount: Double = 0.0

    @ApiModelProperty("社会统一信用代码")
    var creditCode: String? = null

    @ApiModelProperty("接收邮箱")
    lateinit var email: String

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("发票状态")
    lateinit var status: InvoiceStatus

    @ApiModelProperty("发票状态描述")
    lateinit var statusDescription: String

    @ApiModelProperty("拒绝原因")
    var rejectReason: String? = null

    @ApiModelProperty("发票文件URL")
    var invoiceFileUrl: String? = null

    @ApiModelProperty("申请时间")
    var applyTime: Long = 0L

    @ApiModelProperty("开具时间")
    var issueTime: Long? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L
}
