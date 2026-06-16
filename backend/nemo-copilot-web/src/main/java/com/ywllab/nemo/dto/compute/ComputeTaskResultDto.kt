package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.TaskStatus
import com.ywllab.nemo.dto.chart.ChartResponse
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算任务结果响应")
class ComputeTaskResultDto {
    @ApiModelProperty("任务ID")
    var taskId: String = ""

    @ApiModelProperty("任务状态")
    var taskStatus: TaskStatus = TaskStatus.PENDING

    @ApiModelProperty("任务参数")
    var taskParams: Map<String, Any>? = null

    @ApiModelProperty("输入文件")
    var inputFiles: List<TaskFileDto> = emptyList()

    @ApiModelProperty("输出文件列表")
    var outputFiles: List<TaskFileDto> = emptyList()

    @ApiModelProperty("关联图表列表")
    var charts: List<ChartResponse> = emptyList()

    @ApiModelProperty("输出摘要数据")
    var summary: Map<String, Any>? = null

    @ApiModelProperty("异常信息")
    var errorMessage: String? = null
}
