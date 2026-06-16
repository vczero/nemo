package com.ywllab.nemo.dto.chart

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("图表解读请求")
class ChartInterpretRequest {
    @ApiModelProperty("解读目的/用途/图表名称")
    var purpose: String = ""
}
