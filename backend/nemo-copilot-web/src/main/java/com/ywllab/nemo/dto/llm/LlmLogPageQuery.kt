package com.ywllab.nemo.dto.llm

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.PageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * LLM日志分页查询DTO
 */
@ApiModel("LLM日志分页查询")
class LlmLogPageQuery : PageQuery() {
    @ApiModelProperty("用户ID")
    var userId: String? = null

    @ApiModelProperty("业务类型")
    var bizType: ComputeType? = null

    @ApiModelProperty("开始时间")
    var startDate: Long? = null

    @ApiModelProperty("结束时间")
    var endDate: Long? = null
}
