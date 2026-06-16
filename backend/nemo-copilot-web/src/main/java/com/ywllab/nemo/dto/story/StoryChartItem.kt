package com.ywllab.nemo.dto.story

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("故事图表项")
class StoryChartItem {
    @ApiModelProperty("图表ID", required = true)
    lateinit var chartId: String

    @ApiModelProperty("描述")
    var description: String? = null
}
