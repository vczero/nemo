package com.ywllab.nemo.dto.compute.ml

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("ML计算服务响应")
class MlComputeResponseDto {
    @ApiModelProperty("状态消息")
    var message: String? = null

    @ApiModelProperty("计算结果")
    var data: MlComputeResultDto? = null

    @ApiModel("ML计算服务返回结果")
    class MlComputeResultDto {
        @ApiModelProperty("文件列表")
        lateinit var files: List<ComputeOutputFile>

        @ApiModelProperty("摘要数据")
        lateinit var summary: Map<String, Any>
    }
}
