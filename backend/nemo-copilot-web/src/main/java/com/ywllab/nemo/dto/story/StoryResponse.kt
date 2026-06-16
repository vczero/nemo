package com.ywllab.nemo.dto.story

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("故事响应")
class StoryResponse {
    @ApiModelProperty("故事ID")
    lateinit var storyId: String

    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("标题")
    var title: String = ""

    @ApiModelProperty("作者")
    var author: String = ""

    @ApiModelProperty("描述")
    var description: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("更新时间")
    var updateTime: Long = 0L
}
