package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("文件")
class NemoFile : BaseColumn() {
    @ApiModelProperty("文件ID")
    lateinit var fileId: String

    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("文件名")
    var fileName: String = ""

    @ApiModelProperty("OSS存储路径")
    var ossPath: String = ""

    @ApiModelProperty("文件大小（字节）")
    var fileSize: Long = 0L

    @ApiModelProperty("文件类型（扩展名）")
    var fileType: String = ""

    @ApiModelProperty("MIME类型")
    var mimeType: String? = null
}
