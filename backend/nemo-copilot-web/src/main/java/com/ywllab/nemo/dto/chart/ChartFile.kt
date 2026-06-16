package com.ywllab.nemo.dto.chart

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("图表文件信息")
class ChartFile {
    @ApiModelProperty("文件ID")
    lateinit var fileId: String

    @ApiModelProperty("文件名")
    lateinit var fileName: String

    @ApiModelProperty("文件大小")
    var fileSize: Long = 0L

    @ApiModelProperty("文件类型")
    lateinit var fileType: String

    @ApiModelProperty("访问URL")
    lateinit var url: String

    @ApiModelProperty("文件内容（仅小文件返回，大文件使用url下载）")
    var content: String? = null
}
