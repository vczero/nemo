package com.ywllab.nemo.dto.compute.ml

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算结果文件")
class ComputeOutputFile {
    @ApiModelProperty("文件标识名")
    lateinit var name: String

    @ApiModelProperty("OSS路径")
    lateinit var path: String
}
