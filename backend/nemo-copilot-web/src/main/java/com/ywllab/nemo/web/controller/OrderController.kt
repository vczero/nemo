package com.ywllab.nemo.web.controller

import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.subscription.CreateOrderRequest
import com.ywllab.nemo.dto.subscription.PayOrderRequest
import com.ywllab.nemo.dto.subscription.PayOrderResponse
import com.ywllab.nemo.service.OrderService
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

@Api(tags = ["订单"])
@RestController
@RequestMapping("/api/orders")
open class OrderController {

    @Autowired
    lateinit var orderService: OrderService

    @ApiOperation("创建订单")
    @PostMapping("/add")
    open fun add(@RequestBody request: CreateOrderRequest): ResultDto<PayOrderResponse> {
        return ResultDto.success(orderService.createOrder(request))
    }

    @ApiOperation("支付订单")
    @PostMapping("/{orderId}/pay")
    open fun pay(
        @ApiParam("订单ID") @PathVariable orderId: String,
        @RequestBody request: PayOrderRequest
    ): ResultDto<PayOrderResponse> {
        return ResultDto.success(orderService.payOrder(orderId, request))
    }

    @ApiOperation("订单状态")
    @GetMapping("/{orderId}/status")
    open fun status(
        @ApiParam("订单ID") @PathVariable orderId: String
    ): ResultDto<OrderStatus?> {
        return ResultDto.success(orderService.getOrderStatus(orderId))
    }
}
