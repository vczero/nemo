package com.ywllab.nemo.web.controller

import com.ywllab.nemo.annotation.Permission
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.compute.ComputeTaskChartRequest
import com.ywllab.nemo.dto.compute.ComputeTaskDto
import com.ywllab.nemo.dto.compute.ComputeTaskResultDto
import com.ywllab.nemo.dto.compute.ComputeTaskSubmitRequest
import com.ywllab.nemo.dto.compute.ComputeTaskUpdateRequest
import com.ywllab.nemo.service.ComputeEndpointService
import com.ywllab.nemo.service.ComputeTaskService
import com.ywllab.nemo.web.aspect.StandardSubscriptionAuthority
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["计算任务"])
@RestController
@RequestMapping("/api/compute")
open class ComputeController {

    @Autowired
    private lateinit var computeTaskService: ComputeTaskService

    @Autowired
    private lateinit var computeEndpointService: ComputeEndpointService

    @ApiOperation("查询计算服务配置")
    @GetMapping("/config")
    open fun config(@RequestParam taskType: ComputeType): ResultDto<Map<String, Any>> {
        val result = computeEndpointService.getActiveEndpointByType(taskType)
        return ResultDto.success(result.mlServiceConfig)
    }

    @ApiOperation("提交计算任务")
    @PostMapping("/submit")
    @Permission(StandardSubscriptionAuthority::class)
    open fun submit(@RequestBody request: ComputeTaskSubmitRequest): ResultDto<ComputeTaskDto> {
        val result = computeTaskService.submitTask(request)
        return ResultDto.success(result)
    }

    @ApiOperation("查询任务列表")
    @GetMapping("/tasks")
    open fun listTasks(
        param: CommonPageQuery
    ): ResultDto<PageResultDto<ComputeTaskDto>> {
        val result = computeTaskService.listTasks(param)
        return ResultDto.success(result)
    }

    @ApiOperation("获取任务结果")
    @GetMapping("/tasks/{taskId}/result")
    open fun getTaskResult(@PathVariable taskId: String): ResultDto<ComputeTaskResultDto> {
        val result = computeTaskService.getTaskResult(taskId)
        return ResultDto.success(result)
    }

    @ApiOperation("任务关联图表")
    @PostMapping("/{taskId}/charts")
    @Permission(StandardSubscriptionAuthority::class)
    open fun associateCharts(
        @PathVariable taskId: String,
        @RequestBody request: ComputeTaskChartRequest
    ): ResultDto<Unit> {
        computeTaskService.associateCharts(taskId, request.chartIds)
        return ResultDto.success()
    }

    @ApiOperation("删除计算任务")
    @PostMapping("/{taskId}/delete")
    @Permission(StandardSubscriptionAuthority::class)
    open fun deleteTask(@PathVariable taskId: String): ResultDto<Unit> {
        computeTaskService.deleteTask(taskId)
        return ResultDto.success()
    }

    @ApiOperation("修改任务名称")
    @PostMapping("/{taskId}/name")
    @Permission(StandardSubscriptionAuthority::class)
    open fun updateTaskName(
        @PathVariable taskId: String,
        @RequestBody param: ComputeTaskUpdateRequest
    ): ResultDto<Unit> {
        computeTaskService.updateTaskName(taskId, param.taskName)
        return ResultDto.success()
    }
}
