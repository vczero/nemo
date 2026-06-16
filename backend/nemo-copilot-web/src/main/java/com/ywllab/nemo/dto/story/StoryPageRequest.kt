package com.ywllab.nemo.dto.story

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("故事分页请求")
class StoryPageRequest {
    @ApiModelProperty("页码", required = true)
    var pageNum: Int = 1

    @ApiModelProperty("每页数量", required = true)
    var pageSize: Int = 10
}
