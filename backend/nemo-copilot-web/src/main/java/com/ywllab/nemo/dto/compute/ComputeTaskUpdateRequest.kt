package com.ywllab.nemo.dto.compute

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("任务更新请求")
class ComputeTaskUpdateRequest {
    @ApiModelProperty("任务名称")
    var taskName: String = ""
}
