package com.ywllab.nemo.dto.chart

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("更新图表请求")
class ChartUpdateRequest {
    @ApiModelProperty("图表名称")
    var chartName: String = ""

    @ApiModelProperty("图表配置（JSON格式）", required = true)
    var chartConfig: Map<String, Any> = mapOf()

    @ApiModelProperty("图表文件ID")
    var fileId: String? = null
}
