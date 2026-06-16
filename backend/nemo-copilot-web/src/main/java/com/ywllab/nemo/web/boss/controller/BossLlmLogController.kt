package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.llm.LlmLogDetailDto
import com.ywllab.nemo.dto.llm.LlmLogListDto
import com.ywllab.nemo.dto.llm.LlmLogPageQuery
import com.ywllab.nemo.service.LlmLogService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-LLM日志"])
@RestController
@RequestMapping("/boss/api/llm-log")
open class BossLlmLogController {

    @Autowired
    private lateinit var llmLogService: LlmLogService

    @ApiOperation("LLM日志列表")
    @GetMapping("/list")
    open fun list(
        @RequestParam(required = false) userId: String?,
        @RequestParam(required = false) bizType: ComputeType?,
        @RequestParam(required = false) startDate: Long?,
        @RequestParam(required = false) endDate: Long?,
        @RequestParam(defaultValue = "1") pageNum: Int,
        @RequestParam(defaultValue = "20") pageSize: Int
    ): ResultDto<com.ywllab.nemo.dto.PageResultDto<LlmLogListDto>> {
        val query = LlmLogPageQuery().apply {
            this.userId = userId
            this.bizType = bizType
            this.startDate = startDate
            this.endDate = endDate
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        val result = llmLogService.pageLogs(query)
        return ResultDto.success(result)
    }

    @ApiOperation("LLM日志详情")
    @GetMapping("/{logId}")
    open fun getDetail(@PathVariable logId: String): ResultDto<LlmLogDetailDto> {
        val result = llmLogService.getLogDetail(logId)
        return ResultDto.success(result)
    }
}
