package com.ywllab.nemo.model.compute

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@ApiModel("计算任务关联图表")
class ComputeChart : Serializable {
    @ApiModelProperty("任务ID")
    var taskId: String = ""

    @ApiModelProperty("图表ID")
    var chartId: String = ""

    @ApiModelProperty("关联创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("创建人")
    var createBy: String = ""
}
