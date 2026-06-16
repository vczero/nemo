package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.subscription.CalculateResult
import com.ywllab.nemo.dto.subscription.SubscriptionOrderDto
import com.ywllab.nemo.dto.subscription.SubscriptionPlanOptionDto
import com.ywllab.nemo.service.OrderService
import com.ywllab.nemo.service.SubscriptionPlanService
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

@Api(tags = ["订阅"])
@RestController
@RequestMapping("/api/subscription")
open class SubscriptionController {

    @Autowired
    lateinit var orderService: OrderService

    @Autowired
    lateinit var subscriptionPlanService: SubscriptionPlanService

    @ApiOperation("订阅套餐列表")
    @GetMapping("/plans")
    open fun getPlans(): ResultDto<List<SubscriptionPlanOptionDto>> {
        return ResultDto.success(subscriptionPlanService.listPlans())
    }

    @ApiOperation("计算订阅套餐的支付额")
    @GetMapping("/{planId}/calculate")
    open fun calculate(
        @ApiParam("套餐ID") @PathVariable planId: String,
        @ApiParam("订阅月数") @RequestParam subscribeMonth: Int
    ): ResultDto<CalculateResult> {
        return ResultDto.success(subscriptionPlanService.calculateAmount(planId, subscribeMonth))
    }

    @ApiOperation("订阅订单列表")
    @PostMapping("/orders")
    open fun page(pageQuery: CommonPageQuery): ResultDto<PageResultDto<SubscriptionOrderDto>> {
        return ResultDto.success(subscriptionPlanService.getMyPlanOrders(pageQuery))
    }
}
