package com.ywllab.nemo.dto.token

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.PageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("Token消耗记录分页查询")
class TokenUsageRecordPageQuery : PageQuery() {
    @ApiModelProperty("账户ID")
    var accountId: String? = null

    @ApiModelProperty("业务类型")
    var bizType: ComputeType? = null

    @ApiModelProperty("开始时间")
    var startDate: Long? = null

    @ApiModelProperty("结束时间")
    var endDate: Long? = null
}
