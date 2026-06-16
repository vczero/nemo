package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.invoice.AvailableInvoiceAmountDTO
import com.ywllab.nemo.dto.invoice.InvoiceApplyParam
import com.ywllab.nemo.dto.invoice.InvoiceDTO
import com.ywllab.nemo.service.InvoiceService
import com.ywllab.nemo.service.UserSessionHelper
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["发票"])
@RestController
@RequestMapping("/api/invoices")
open class InvoiceController {

    @Autowired
    lateinit var invoiceService: InvoiceService

    @ApiOperation("申请开具发票")
    @PostMapping("/apply")
    open fun apply(@RequestBody request: InvoiceApplyParam): ResultDto<String> {
        return ResultDto.success(invoiceService.applyInvoice(request))
    }

    @ApiOperation("获取可开票金额")
    @GetMapping("/available-amount")
    open fun getAvailableAmount(): ResultDto<AvailableInvoiceAmountDTO> {
        val userId = UserSessionHelper.getUserId()
        return ResultDto.success(invoiceService.getAvailableInvoiceAmount(userId))
    }

    @ApiOperation("我的发票列表")
    @GetMapping("/page")
    open fun page(query: CommonPageQuery): ResultDto<PageResultDto<InvoiceDTO>> {
        return ResultDto.success(invoiceService.getMyInvoices(query))
    }

    @ApiOperation("发票详情")
    @GetMapping("/{invoiceId}/get")
    open fun detail(
        @ApiParam("发票ID") @PathVariable invoiceId: String
    ): ResultDto<InvoiceDTO?> {
        return ResultDto.success(invoiceService.getInvoiceDetail(invoiceId))
    }
}
