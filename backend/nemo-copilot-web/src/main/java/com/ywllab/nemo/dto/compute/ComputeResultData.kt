package com.ywllab.nemo.dto.compute

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("外部计算服务返回的标准数据结构")
class ComputeResultData {
    @ApiModelProperty("结果文件路径")
    var files: ComputeResultFiles? = null

    @ApiModelProperty("摘要数据")
    var summary: Map<String, Any>? = null
}

@ApiModel("外部计算结果文件路径")
class ComputeResultFiles {
    @ApiModelProperty("全部结果文件OSS路径")
    var allResultOssFilePath: String? = null

    @ApiModelProperty("图表结果文件OSS路径")
    var chartResultOssFilePath: String? = null
}
