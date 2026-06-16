package com.ywllab.nemo.dto.invoice

import com.ywllab.nemo.constant.InvoiceStatus
import com.ywllab.nemo.constant.InvoiceType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * 发票查询请求
 */
@ApiModel("发票查询请求")
class InvoiceQueryParam {
    @ApiModelProperty("页码, 从1开始")
    var pageNum: Long = 1

    @ApiModelProperty("页长")
    var pageSize: Long = 20

    @ApiModelProperty("关键词(发票抬头)")
    var keyword: String? = null

    @ApiModelProperty("发票状态")
    var status: InvoiceStatus? = null

    @ApiModelProperty("发票类型")
    var invoiceType: InvoiceType? = null

    @ApiModelProperty("用户ID")
    var userId: String? = null
}
