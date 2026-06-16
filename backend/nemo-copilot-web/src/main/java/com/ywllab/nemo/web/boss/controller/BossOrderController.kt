package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.subscription.OrderDetailDto
import com.ywllab.nemo.dto.subscription.OrderDto
import com.ywllab.nemo.dto.subscription.OrderQuery
import com.ywllab.nemo.dto.subscription.PayOrderResponse
import com.ywllab.nemo.service.OrderService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.Date

@Api(tags = ["BOSS-订单管理"])
@RestController
@RequestMapping("/boss/api/orders")
open class BossOrderController {

    @Autowired
    lateinit var orderService: OrderService

    @ApiOperation("订单列表")
    @GetMapping
    open fun listOrders(
        @ApiParam("页码") @RequestParam(required = false) pageNum: Int?,
        @ApiParam("每页数量") @RequestParam(required = false) pageSize: Int?,
        @ApiParam("关键词搜索") @RequestParam(required = false) keyword: String?,
        @ApiParam("订单状态") @RequestParam(required = false) status: String?,
        @ApiParam("用户ID") @RequestParam(required = false) userId: String?,
        @ApiParam("产品ID") @RequestParam(required = false) productId: String?,
        @ApiParam("套餐ID") @RequestParam(required = false) planId: String?,
        @ApiParam("开始时间") @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") startTime: Date?,
        @ApiParam("结束时间") @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") endTime: Date?
    ): ResultDto<PageResultDto<OrderDto>> {
        val orderQuery = OrderQuery().apply {
            this.pageNum = (pageNum ?: 1).toLong()
            this.pageSize = (pageSize ?: 20).toLong()
            this.keyword = keyword ?: ""
            this.status = status?.let { OrderStatus.valueOf(it) }
            this.userId = userId
            this.productId = productId
            this.planId = planId
            this.startTime = startTime?.time
            this.endTime = endTime?.time
        }
        return ResultDto.success(orderService.listOrdersForAdmin(orderQuery))
    }

    @ApiOperation("订单详情")
    @GetMapping("/{orderId}")
    open fun getOrderDetail(
        @ApiParam("订单ID") @PathVariable orderId: String
    ): ResultDto<OrderDetailDto?> {
        return ResultDto.success(orderService.getOrderDetailForAdmin(orderId))
    }

    @ApiOperation("订单统计")
    @GetMapping("/statistics")
    open fun getStatistics(): ResultDto<Map<String, Any>> {
        return ResultDto.success(orderService.getOrderStatistics())
    }

    @ApiOperation("标记订单为已支付（调试用）")
    @PostMapping("/{orderId}/finish")
    open fun finishOrder(
        @ApiParam("订单ID") @PathVariable orderId: String
    ): ResultDto<PayOrderResponse> {
        return ResultDto.success(orderService.finishOrderByAdmin(orderId))
    }
}
