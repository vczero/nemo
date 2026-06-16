package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.subscription.CreateProductRequest
import com.ywllab.nemo.dto.subscription.CreateSubscriptionPlanRequest
import com.ywllab.nemo.dto.subscription.ProductDto
import com.ywllab.nemo.dto.subscription.SubscriptionFeatureDto
import com.ywllab.nemo.dto.subscription.SubscriptionPlanDto
import com.ywllab.nemo.dto.subscription.UpdateProductRequest
import com.ywllab.nemo.dto.subscription.UpdateSubscriptionPlanRequest
import com.ywllab.nemo.service.ProductService
import com.ywllab.nemo.service.SubscriptionPlanService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-订阅管理"])
@RestController
@RequestMapping("/boss/api/subscription")
open class BossSubscriptionController {

    @Autowired
    lateinit var subscriptionPlanService: SubscriptionPlanService

    @Autowired
    lateinit var productService: ProductService

    @ApiOperation("套餐列表")
    @GetMapping("/plans")
    open fun listPlans(
        @ApiParam("页码") @RequestParam(required = false) pageNum: Int?,
        @ApiParam("每页数量") @RequestParam(required = false) pageSize: Int?
    ): ResultDto<PageResultDto<SubscriptionPlanDto>> {
        return ResultDto.success(subscriptionPlanService.list(pageNum ?: 1, pageSize ?: 20))
    }

    @ApiOperation("创建套餐")
    @PostMapping("/plans")
    open fun createPlan(@RequestBody request: CreateSubscriptionPlanRequest): ResultDto<SubscriptionPlanDto> {
        return ResultDto.success(subscriptionPlanService.create(request))
    }

    @ApiOperation("更新套餐")
    @PostMapping("/plans/{planId}")
    open fun updatePlan(
        @ApiParam("套餐ID") @PathVariable planId: String,
        @RequestBody request: UpdateSubscriptionPlanRequest
    ): ResultDto<SubscriptionPlanDto> {
        return ResultDto.success(subscriptionPlanService.updatePlan(planId, request))
    }

    @ApiOperation("设置主推套餐")
    @PostMapping("/plans/{planId}/recommend")
    open fun setRecommendedPlan(
        @ApiParam("套餐ID") @PathVariable planId: String
    ): ResultDto<SubscriptionPlanDto> {
        return ResultDto.success(subscriptionPlanService.setRecommendedPlan(planId))
    }

    @ApiOperation("产品列表")
    @GetMapping("/products")
    open fun listProducts(
        @ApiParam("页码") @RequestParam(required = false) pageNum: Int?,
        @ApiParam("每页数量") @RequestParam(required = false) pageSize: Int?,
        @ApiParam("套餐ID") @RequestParam(required = false) planId: String?
    ): ResultDto<PageResultDto<ProductDto>> {
        return ResultDto.success(productService.list(pageNum ?: 1, pageSize ?: 20, planId))
    }

    @ApiOperation("创建产品")
    @PostMapping("/products")
    open fun createProduct(@RequestBody request: CreateProductRequest): ResultDto<ProductDto> {
        return ResultDto.success(productService.create(request))
    }

    @ApiOperation("更新产品")
    @PostMapping("/products/{productId}")
    open fun updateProduct(
        @ApiParam("产品ID") @PathVariable productId: String,
        @RequestBody request: UpdateProductRequest
    ): ResultDto<ProductDto> {
        return ResultDto.success(productService.update(productId, request))
    }

    @ApiOperation("上下架产品")
    @PostMapping("/products/{productId}/{flag}")
    open fun updateProductStatus(
        @ApiParam("产品ID") @PathVariable productId: String,
        @ApiParam("是否上架") @PathVariable flag: Boolean
    ): ResultDto<ProductDto> {
        return ResultDto.success(productService.updateStatus(productId, flag))
    }

    @ApiOperation("获取订阅功能列表")
    @GetMapping("/features")
    open fun getFeatures(): ResultDto<List<SubscriptionFeatureDto>> {
        val features = com.ywllab.nemo.constant.SubscriptionFeature.values().map { feature ->
            SubscriptionFeatureDto().apply {
                name = feature.name
                title = feature.title
                description = feature.description
            }
        }
        return ResultDto.success(features)
    }
}
