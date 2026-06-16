package com.ywllab.nemo.dto.file

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("文件上传响应")
class FileUploadResponse {
    @ApiModelProperty("文件ID")
    var fileId: String = ""

    @ApiModelProperty("文件名")
    var fileName: String = ""

    @ApiModelProperty("OSS路径")
    var ossPath: String = ""

    @ApiModelProperty("访问URL")
    var url: String = ""

    @ApiModelProperty("文件大小")
    var fileSize: Long = 0L
}
