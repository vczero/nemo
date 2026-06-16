package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.TaskStatus
import com.ywllab.nemo.model.compute.ComputeTask
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算任务响应")
class ComputeTaskDto {
    @ApiModelProperty("用户ID")
    var userId: String? = null

    @ApiModelProperty("用户名")
    var username: String? = null

    @ApiModelProperty("任务名称")
    var taskName: String? = null

    @ApiModelProperty("任务ID")
    var taskId: String = ""

    @ApiModelProperty("端点类型")
    var taskType: ComputeType = ComputeType.SEGMENTATION

    @ApiModelProperty("任务状态")
    var taskStatus: TaskStatus = TaskStatus.PENDING

    @ApiModelProperty("任务参数JSON")
    var taskParams: Map<String, Any>? = null

    @ApiModelProperty("输入文件列表")
    var inputFiles: List<TaskFileDto> = emptyList()

    @ApiModelProperty("输出文件列表")
    var outputFiles: List<TaskFileDto> = emptyList()

    @ApiModelProperty("任务摘要")
    var summary: Map<String, Any>? = null

    @ApiModelProperty("异常信息")
    var errorMessage: String? = null

    @ApiModelProperty("已重试次数")
    var retryCount: Int = 0

    @ApiModelProperty("开始时间")
    var startTime: Long? = null

    @ApiModelProperty("结束时间")
    var endTime: Long? = null

    constructor()

    constructor(
        task: ComputeTask,
        username: String?,
        inputFiles: List<TaskFileDto>,
        outputFiles: List<TaskFileDto>,
        summary: Map<String, Any>?
    ) {
        this.userId = task.userId
        this.username = username
        this.taskName = task.taskName
        this.taskId = task.taskId
        this.taskParams = task.taskParams
        this.taskType = task.endpointType
        this.taskStatus = task.taskStatus
        this.inputFiles = inputFiles
        this.outputFiles = outputFiles
        this.summary = summary
        this.errorMessage = task.errorMessage
        this.retryCount = task.retryCount
        this.startTime = task.startTime
        this.endTime = task.endTime
    }
}
