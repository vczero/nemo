package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.token.TokenUsageRecordDetailDto
import com.ywllab.nemo.dto.token.TokenUsageRecordListDto
import com.ywllab.nemo.dto.token.TokenUsageRecordPageQuery
import com.ywllab.nemo.service.TokenUsageRecordService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-Token消耗记录"])
@RestController
@RequestMapping("/boss/api/token-usage-record")
open class BossTokenUsageRecordController {

    @Autowired
    private lateinit var tokenUsageRecordService: TokenUsageRecordService

    @ApiOperation("Token消耗记录列表")
    @GetMapping("/list")
    open fun list(
        @RequestParam(required = false) accountId: String?,
        @RequestParam(required = false) bizType: ComputeType?,
        @RequestParam(required = false) startDate: Long?,
        @RequestParam(required = false) endDate: Long?,
        @RequestParam(defaultValue = "1") pageNum: Int,
        @RequestParam(defaultValue = "20") pageSize: Int
    ): ResultDto<PageResultDto<TokenUsageRecordListDto>> {
        val query = TokenUsageRecordPageQuery().apply {
            this.accountId = accountId
            this.bizType = bizType
            this.startDate = startDate
            this.endDate = endDate
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        val result = tokenUsageRecordService.pageRecords(query)
        return ResultDto.success(result)
    }

    @ApiOperation("Token消耗记录详情")
    @GetMapping("/{recordId}")
    open fun getDetail(@PathVariable recordId: String): ResultDto<TokenUsageRecordDetailDto> {
        val result = tokenUsageRecordService.getRecordDetail(recordId)
        return ResultDto.success(result)
    }
}
