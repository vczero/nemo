package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.ComputeEndpointStatus
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.compute.ComputeEndpointDto
import com.ywllab.nemo.dto.compute.ComputeEndpointPageQuery
import com.ywllab.nemo.dto.compute.ComputeTypeDto
import com.ywllab.nemo.dto.compute.CreateComputeEndpointRequest
import com.ywllab.nemo.dto.compute.UpdateComputeEndpointRequest
import com.ywllab.nemo.service.ComputeEndpointService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-计算服务"])
@RestController
@RequestMapping("/boss/api/compute/endpoints")
open class BossComputeEndpointController {

    @Autowired
    private lateinit var computeEndpointService: ComputeEndpointService

    @ApiOperation("分页查询端点配置")
    @GetMapping("/page")
    open fun page(query: ComputeEndpointPageQuery): ResultDto<PageResultDto<ComputeEndpointDto>> {
        val result = computeEndpointService.pageServices(query)
        return ResultDto.success(result)
    }

    @ApiOperation("创建端点配置")
    @PostMapping
    open fun create(@RequestBody request: CreateComputeEndpointRequest): ResultDto<ComputeEndpointDto> {
        val result = computeEndpointService.createService(request)
        return ResultDto.success(result)
    }

    @ApiOperation("更新端点配置")
    @PostMapping("/{endpointId}")
    open fun update(
        @PathVariable endpointId: String,
        @RequestBody request: UpdateComputeEndpointRequest
    ): ResultDto<ComputeEndpointDto> {
        val result = computeEndpointService.updateService(endpointId, request)
        return ResultDto.success(result)
    }

    @ApiOperation("启用/禁用端点")
    @PostMapping("/{endpointId}/status/{status}")
    open fun updateStatus(
        @PathVariable endpointId: String,
        @PathVariable status: String
    ): ResultDto<ComputeEndpointDto> {
        val result = computeEndpointService.updateStatus(endpointId, ComputeEndpointStatus.fromValue(status))
        return ResultDto.success(result)
    }

    @ApiOperation("查询端点详情")
    @GetMapping("/{endpointId}")
    open fun get(@PathVariable endpointId: String): ResultDto<ComputeEndpointDto> {
        val result = computeEndpointService.getService(endpointId)
        return ResultDto.success(result)
    }

    @ApiOperation("删除端点配置")
    @PostMapping("/{endpointId}/delete")
    open fun delete(@PathVariable endpointId: String): ResultDto<Nothing> {
        computeEndpointService.deleteService(endpointId)
        return ResultDto.success()
    }

    @ApiOperation("查询计算类型列表")
    @GetMapping("/compute-types")
    open fun getComputeTypes(): ResultDto<List<ComputeTypeDto>> {
        val computeTypes = ComputeType.values().map { computeType ->
            val dto = ComputeTypeDto()
            dto.category = computeType.category.name
            dto.name = computeType.name
            dto.label = computeType.desc
            dto
        }
        return ResultDto.success(computeTypes)
    }
}
