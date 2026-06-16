package com.ywllab.nemo.dto.story

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("故事图表详情响应")
class StoryChartDetailResponse {
    @ApiModelProperty("图表ID")
    lateinit var chartId: String

    @ApiModelProperty("图表名称")
    var chartName: String = ""

    @ApiModelProperty("图表缩略图URL")
    var thumbnailUrl: String? = null

    @ApiModelProperty("描述")
    var description: String? = null

    @ApiModelProperty("排序顺序")
    var sortOrder: Int = 0
}
