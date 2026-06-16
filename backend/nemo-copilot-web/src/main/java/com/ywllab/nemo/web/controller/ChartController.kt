package com.ywllab.nemo.web.controller

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.annotation.Permission
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.chart.ChartCreateRequest
import com.ywllab.nemo.dto.chart.ChartInterpretRequest
import com.ywllab.nemo.dto.chart.ChartPageRequest
import com.ywllab.nemo.dto.chart.ChartPageResponse
import com.ywllab.nemo.dto.chart.ChartResponse
import com.ywllab.nemo.dto.chart.ChartUpdateRequest
import com.ywllab.nemo.service.ChartService
import com.ywllab.nemo.util.SseUtil
import com.ywllab.nemo.web.aspect.StandardSubscriptionAuthority
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
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@Api(tags = ["图表"])
@RestController
@RequestMapping("/api/charts")
open class ChartController {

    @Autowired
    lateinit var chartService: ChartService

    @ApiOperation("分页查询图表列表")
    @PostMapping("/page")
    open fun page(@RequestBody request: ChartPageRequest): ResultDto<PageResultDto<ChartPageResponse>> {
        return ResultDto(chartService.page(request))
    }

    @ApiOperation("查询图表配置")
    @GetMapping("/{chartId}/get")
    open fun get(
        @ApiParam("图表ID") @PathVariable chartId: String,
        @ApiParam("是否返回关联文件")
        @RequestParam("withChartFile", required = false) withChartFile: Boolean = true,
        @ApiParam("是否返回图表配置")
        @RequestParam("withChartConfig", required = false) withChartConfig: Boolean = true,
    ): ResultDto<ChartResponse?> {
        val chart = chartService.getChart(chartId, withChartFile, withChartConfig)
        return ResultDto.success(chart)
    }

    @ApiOperation("创建图表")
    @PostMapping("/add")
    @Permission(StandardSubscriptionAuthority::class)
    open fun add(@RequestBody request: ChartCreateRequest): ResultDto<String> {
        val chartId = chartService.createChart(request)
        return ResultDto.success(chartId)
    }

    @ApiOperation("更新图表配置")
    @PostMapping("/{chartId}/update")
    @Permission(StandardSubscriptionAuthority::class)
    open fun update(
        @ApiParam("图表ID") @PathVariable chartId: String,
        @ApiParam(
            "图表配置",
            type = "com.ywllab.nemo.dto.chart.ChartUpdateRequest"
        ) @RequestParam("param", required = false) param: String? = null,
        @ApiParam("缩略图") @RequestParam(value = "thumbnail", required = false) thumbnail: MultipartFile? = null
    ): ResultDto<String> {
        val updateRequest = if (param.isNullOrBlank()) {
            null
        } else {
            JSONUtil.toBean(param, ChartUpdateRequest::class.java)
        }
        chartService.updateChart(updateRequest, chartId, thumbnail)
        return ResultDto.success()
    }

    @ApiOperation("删除图表")
    @PostMapping("/{chartId}/delete")
    @Permission(StandardSubscriptionAuthority::class)
    open fun delete(@ApiParam("图表ID") @PathVariable chartId: String): ResultDto<String> {
        chartService.deleteChart(chartId)
        return ResultDto.success()
    }

    @ApiOperation("解读图表")
    @PostMapping("/{chartId}/interpret")
    open fun completion(
        @ApiParam("图表ID") @PathVariable chartId: String,
        @RequestBody request: ChartInterpretRequest
    ): SseEmitter {
        return SseUtil.createLlmSseEmitter {
            chartService.chartInterpret(chartId, request.purpose, it)
        }
    }

    @ApiOperation("解读翻译")
    @PostMapping("/{chartId}/interpret/translate")
    open fun translate(@ApiParam("图表ID") @PathVariable chartId: String): SseEmitter {
        return SseUtil.createLlmSseEmitter {
            chartService.chartInterpretTranslate(chartId, it)
        }
    }
}
