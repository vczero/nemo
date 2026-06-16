package com.ywllab.nemo.dto.chart

import com.ywllab.nemo.constant.ComputeType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("图表关联的计算任务信息")
class ChartTaskInfo {
    @ApiModelProperty("任务ID")
    lateinit var taskId: String

    @ApiModelProperty("任务类型")
    lateinit var taskType: ComputeType
}
