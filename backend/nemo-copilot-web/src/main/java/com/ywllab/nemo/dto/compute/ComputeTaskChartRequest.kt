package com.ywllab.nemo.dto.compute

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("任务关联图表请求")
class ComputeTaskChartRequest {
    @ApiModelProperty("图表ID列表")
    lateinit var chartIds: List<String>
}
