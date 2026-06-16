package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("故事")
class Story : BaseColumn() {
    @ApiModelProperty("故事ID")
    lateinit var storyId: String

    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("故事标题")
    var title: String = ""

    @ApiModelProperty("作者")
    var author: String = ""

    @ApiModelProperty("故事描述")
    var description: String? = null
}
