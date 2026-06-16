package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.tokenpack.TokenPackOrderDto
import com.ywllab.nemo.dto.tokenpack.TokenPackProductDto
import com.ywllab.nemo.service.TokenPackService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["流量包"])
@RestController
@RequestMapping("/api/token-pack")
open class TokenPackController {

    @Autowired
    lateinit var tokenPackService: TokenPackService

    @ApiOperation("流量包产品列表")
    @GetMapping("/products")
    open fun getProducts(): ResultDto<List<TokenPackProductDto>> {
        return ResultDto.success(tokenPackService.listTokenPackProducts())
    }

    @ApiOperation("我的流量包订单列表")
    @GetMapping("/orders")
    open fun getMyOrders(
        commonPageQuery: CommonPageQuery
    ): ResultDto<PageResultDto<TokenPackOrderDto>> {
        val pageResult = tokenPackService.getMyTokenPackOrders(commonPageQuery)
        return ResultDto(pageResult)
    }
}
