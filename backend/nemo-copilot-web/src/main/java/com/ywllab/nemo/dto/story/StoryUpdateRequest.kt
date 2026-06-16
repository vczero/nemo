package com.ywllab.nemo.dto.story

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("更新故事请求")
class StoryUpdateRequest {
    @ApiModelProperty("故事标题", required = true)
    var title: String = ""

    @ApiModelProperty("作者", required = true)
    var author: String = ""

    @ApiModelProperty("故事描述")
    var description: String? = null

    @ApiModelProperty("关联图表列表")
    var charts: List<StoryChartItem>? = null
}
