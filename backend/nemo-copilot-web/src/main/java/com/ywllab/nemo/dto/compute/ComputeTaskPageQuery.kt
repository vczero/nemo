package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.TaskStatus
import com.ywllab.nemo.dto.PageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算任务分页查询")
class ComputeTaskPageQuery : PageQuery() {
    @ApiModelProperty("用户ID")
    var userId: String? = null

    @ApiModelProperty("端点类型")
    var endpointType: ComputeType? = null

    @ApiModelProperty("任务状态")
    var taskStatus: TaskStatus? = null

    @ApiModelProperty("任务名称或任务ID（模糊查名称/精确查ID）")
    var taskName: String? = null
}
