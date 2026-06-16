package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ComputeType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("提交计算任务请求")
class ComputeTaskSubmitRequest {
    @ApiModelProperty("任务类型", required = true)
    var taskType: ComputeType = ComputeType.SEGMENTATION

    @ApiModelProperty("任务名称")
    lateinit var taskName: String

    @ApiModelProperty("任务参数")
    var taskParams: MutableMap<String, Any> = mutableMapOf()

    @ApiModelProperty("输入文件列表")
    var inputFiles: List<ComputeInputFile> = emptyList()

    @ApiModel("输入文件")
    class ComputeInputFile {
        @ApiModelProperty("设置到taskParams中的字段名，透传给计算任务")
        lateinit var name: String

        @ApiModelProperty("文件ID")
        lateinit var id: String

        @ApiModelProperty("OSS文件路径")
        lateinit var path: String
    }
}
