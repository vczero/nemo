package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("图表文件关联")
class ChartFileRel {
    @ApiModelProperty("图表ID")
    var chartId: String = ""

    @ApiModelProperty("文件ID")
    var fileId: String = ""

    @ApiModelProperty("关联创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("创建人")
    var createBy: String = ""
}
