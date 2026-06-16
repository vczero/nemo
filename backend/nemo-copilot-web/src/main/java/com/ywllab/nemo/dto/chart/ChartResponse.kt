package com.ywllab.nemo.dto.chart

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("图表响应")
class ChartResponse {
    @ApiModelProperty("图表ID")
    var chartId: String = ""

    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("图表名称")
    var chartName: String = ""

    @ApiModelProperty("图表配置")
    var chartConfig: Map<String, Any>? = mapOf()

    @ApiModelProperty("图表文件信息")
    var chartFile: ChartFile? = null

    @ApiModelProperty("缩略图URL")
    var thumbnailUrl: String? = null

    @ApiModelProperty("图表解读结果（中文）")
    var interpretContent: String? = null

    @ApiModelProperty("图表解读结果（英文）")
    var interpretContentEn: String? = null

    @ApiModelProperty("图表业务用途")
    var purpose: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("更新时间")
    var updateTime: Long = 0L
}
