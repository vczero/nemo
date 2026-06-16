package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.channel.ChannelOrderCreateRequest
import com.ywllab.nemo.dto.channel.ChannelOrderPageParam
import com.ywllab.nemo.dto.channel.ChannelOrderResponse
import com.ywllab.nemo.service.ChannelOrderService
import com.ywllab.nemo.service.UserSessionHelper
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ModelAttribute
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-渠道订单管理"])
@RestController
@RequestMapping("/boss/api/channel-orders")
open class BossChannelOrderController {

    @Autowired
    lateinit var channelOrderService: ChannelOrderService

    @ApiOperation("渠道订单列表")
    @GetMapping
    open fun pageChannelOrders(
        @ModelAttribute request: ChannelOrderPageParam
    ): ResultDto<PageResultDto<ChannelOrderResponse>> {
        return ResultDto.success(channelOrderService.pageChannelOrders(request))
    }

    @ApiOperation("创建渠道订单")
    @PostMapping
    open fun createChannelOrder(
        @RequestBody request: ChannelOrderCreateRequest
    ): ResultDto<ChannelOrderResponse> {
        val operator = UserSessionHelper.getUserId()
        val response = channelOrderService.createChannelOrder(request, operator)
        return ResultDto.success(response)
    }

    @ApiOperation("渠道订单详情")
    @GetMapping("/{orderId}")
    open fun getChannelOrder(
        @PathVariable orderId: String
    ): ResultDto<ChannelOrderResponse?> {
        return ResultDto.success(channelOrderService.getChannelOrder(orderId))
    }
}
