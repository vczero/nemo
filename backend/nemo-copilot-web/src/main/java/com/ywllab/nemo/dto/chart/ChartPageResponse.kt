package com.ywllab.nemo.dto.chart

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("图表分页查询响应")
class ChartPageResponse {

    @ApiModelProperty("图表ID")
    lateinit var chartId: String

    @ApiModelProperty("关联的计算任务信息")
    var task: ChartTaskInfo? = null

    @ApiModelProperty("图表名称")
    var chartName: String = ""

    @ApiModelProperty("缩略图URL")
    var thumbnailUrl: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("更新时间")
    var updateTime: Long = 0L

    @ApiModelProperty("图表业务用途")
    var purpose: String? = null
}
