package com.ywllab.nemo.dto.compute

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算任务关联图表DTO")
class ComputeChartDto {
    @ApiModelProperty("图表ID")
    var chartId: String = ""

    @ApiModelProperty("图表名称")
    var chartName: String = ""

    @ApiModelProperty("图表配置")
    var chartConfig: Map<String, Any> = emptyMap()

    @ApiModelProperty("缩略图URL")
    var thumbnailUrl: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L
}
