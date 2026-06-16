package com.ywllab.nemo.dto.compute

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * 文本摘要任务参数DTO
 */
@ApiModel("文本摘要任务参数")
class TextSummaryParamsDto {
    @ApiModelProperty("摘要最大字数")
    var maxSummaryLength: Int = 200

    @ApiModelProperty("摘要用途/目的")
    var purpose: String = ""
}
