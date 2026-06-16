package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("图表")
class Chart : BaseColumn() {
    @ApiModelProperty("图表ID")
    lateinit var chartId: String

    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("图表名称")
    var chartName: String = ""

    @ApiModelProperty("图表配置（JSON格式）")
    var chartConfig: Map<String, Any> = mapOf()

    @ApiModelProperty("缩略图OSS路径")
    var chartThumbnailPath: String? = null

    @ApiModelProperty("图表解读结果（中文）")
    var interpretContent: String? = null

    @ApiModelProperty("图表解读结果（英文）")
    var interpretContentEn: String? = null

    @ApiModelProperty("图表业务用途")
    var purpose: String? = null
}
