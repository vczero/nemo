package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.compute.ComputeTaskDto
import com.ywllab.nemo.dto.compute.ComputeTaskPageQuery
import com.ywllab.nemo.dto.compute.ComputeTaskStatisticsDto
import com.ywllab.nemo.service.ComputeTaskService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-计算任务"])
@RestController
@RequestMapping("/boss/api/compute/tasks")
open class BossComputeTaskController {

    @Autowired
    private lateinit var computeTaskService: ComputeTaskService

    @ApiOperation("分页查询任务列表")
    @GetMapping("/page")
    open fun page(query: ComputeTaskPageQuery): ResultDto<com.ywllab.nemo.dto.PageResultDto<ComputeTaskDto>> {
        val result = computeTaskService.pageTasks(query)
        return ResultDto.success(result)
    }

    @ApiOperation("查询任务详情")
    @GetMapping("/{taskId}")
    open fun get(@PathVariable taskId: String): ResultDto<ComputeTaskDto> {
        val task = computeTaskService.getTask(taskId)
        return ResultDto.success(task)
    }

    @ApiOperation("重试失败任务")
    @PostMapping("/{taskId}/retry")
    open fun retry(@PathVariable taskId: String): ResultDto<ComputeTaskDto> {
        val result = computeTaskService.retryTask(taskId)
        return ResultDto.success(result)
    }

    @ApiOperation("获取任务统计")
    @GetMapping("/statistics")
    open fun statistics(): ResultDto<ComputeTaskStatisticsDto> {
        val result = computeTaskService.getStatistics()
        return ResultDto.success(result)
    }
}
