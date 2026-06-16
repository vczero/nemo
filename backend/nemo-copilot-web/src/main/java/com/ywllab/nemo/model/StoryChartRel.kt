package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("故事图表关联")
class StoryChartRel : BaseColumn() {
    @ApiModelProperty("故事ID")
    lateinit var storyId: String

    @ApiModelProperty("图表ID")
    lateinit var chartId: String

    @ApiModelProperty("描述")
    var description: String? = null

    @ApiModelProperty("排序顺序")
    var sortOrder: Int = 0
}
