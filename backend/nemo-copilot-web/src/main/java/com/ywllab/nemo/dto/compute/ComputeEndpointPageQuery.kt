package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.CommonPageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算服务分页查询")
class ComputeEndpointPageQuery : CommonPageQuery() {
    @ApiModelProperty("执行器类别")
    var execCategory: String? = null

    @ApiModelProperty("端点类型")
    var endpointType: ComputeType? = null

    @ApiModelProperty("端点状态")
    var status: String? = null
}
