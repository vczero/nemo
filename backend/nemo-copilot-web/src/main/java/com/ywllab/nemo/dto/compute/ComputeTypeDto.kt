package com.ywllab.nemo.dto.compute

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算类型")
class ComputeTypeDto {
    @ApiModelProperty("类别")
    var category: String = ""

    @ApiModelProperty("名称")
    var name: String = ""

    @ApiModelProperty("标签")
    var label: String = ""
}
