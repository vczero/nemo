package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.InvoiceStatus
import com.ywllab.nemo.constant.InvoiceType
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.invoice.InvoiceDTO
import com.ywllab.nemo.dto.invoice.InvoiceQueryParam
import com.ywllab.nemo.service.InvoiceService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-发票管理"])
@RestController
@RequestMapping("/boss/api/invoices")
open class BossInvoiceController {

    @Autowired
    lateinit var invoiceService: InvoiceService

    @ApiOperation("发票列表")
    @GetMapping
    open fun listInvoices(
        @ApiParam("页码") @RequestParam(required = false) pageNum: Int?,
        @ApiParam("每页数量") @RequestParam(required = false) pageSize: Int?,
        @ApiParam("关键词搜索") @RequestParam(required = false) keyword: String?,
        @ApiParam("发票状态") @RequestParam(required = false) status: String?,
        @ApiParam("发票类型") @RequestParam(required = false) invoiceType: String?,
        @ApiParam("用户ID") @RequestParam(required = false) userId: String?
    ): ResultDto<PageResultDto<InvoiceDTO>> {
        val query = InvoiceQueryParam().apply {
            this.pageNum = (pageNum ?: 1).toLong()
            this.pageSize = (pageSize ?: 20).toLong()
            this.keyword = keyword
            this.status = status?.let { InvoiceStatus.valueOf(it) }
            this.invoiceType = invoiceType?.let { InvoiceType.valueOf(it) }
            this.userId = userId
        }
        return ResultDto.success(invoiceService.listInvoicesForAdmin(query))
    }

    @ApiOperation("发票详情")
    @GetMapping("/{invoiceId}")
    open fun getInvoiceDetail(
        @ApiParam("发票ID") @PathVariable invoiceId: String
    ): ResultDto<InvoiceDTO?> {
        return ResultDto.success(invoiceService.getInvoiceDetailForAdmin(invoiceId))
    }

    @ApiOperation("开具发票")
    @PostMapping("/{invoiceId}/issue")
    open fun issueInvoice(
        @ApiParam("发票ID") @PathVariable invoiceId: String,
        @ApiParam("发票文件URL") @RequestParam invoiceFileUrl: String
    ): ResultDto<Nothing> {
        invoiceService.issueInvoice(invoiceId, invoiceFileUrl)
        return ResultDto.success()
    }

    @ApiOperation("更新发票状态")
    @PostMapping("/{invoiceId}/status")
    open fun updateStatus(
        @ApiParam("发票ID") @PathVariable invoiceId: String,
        @ApiParam("发票状态") @RequestParam status: InvoiceStatus,
        @ApiParam("拒绝原因") @RequestParam(required = false) rejectReason: String?,
        @ApiParam("发票文件URL") @RequestParam(required = false) invoiceFileUrl: String?
    ): ResultDto<Nothing> {
        invoiceService.updateInvoiceStatus(invoiceId, status, rejectReason, invoiceFileUrl)
        return ResultDto.success()
    }
}
