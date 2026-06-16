package com.ywllab.nemo.model.compute

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.TaskStatus
import com.ywllab.nemo.model.BaseColumn
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算任务")
class ComputeTask : BaseColumn() {
    @ApiModelProperty("任务名称")
    var taskName: String? = null

    @ApiModelProperty("任务ID")
    lateinit var taskId: String

    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("计算服务ID")
    var endpointId: String = ""

    @ApiModelProperty("端点类型")
    var endpointType: ComputeType = ComputeType.SEGMENTATION

    @ApiModelProperty("任务参数JSON")
    var taskParams: Map<String, Any> = emptyMap()

    @ApiModelProperty("任务状态")
    var taskStatus: TaskStatus = TaskStatus.PENDING

    @ApiModelProperty("任务摘要JSON")
    var summary: String? = null

    @ApiModelProperty("异常信息")
    var errorMessage: String? = null

    @ApiModelProperty("已重试次数")
    var retryCount: Int = 0

    @ApiModelProperty("开始时间")
    var startTime: Long? = null

    @ApiModelProperty("结束时间")
    var endTime: Long? = null

    @ApiModelProperty("外部系统任务ID")
    var externalTaskId: String? = null

    @ApiModelProperty("输入token数")
    var inputTokenCount: Int? = null

    @ApiModelProperty("输出token数")
    var outputTokenCount: Int? = null

    @ApiModelProperty("本次任务消耗积分/配额")
    var tokenCost: Long? = null

    @ApiModelProperty("执行节点IP")
    var workerHost: String? = null
}
