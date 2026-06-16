package com.ywllab.nemo.dto.agreement

import com.ywllab.nemo.dto.CommonPageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户协议授权记录分页查询请求")
class UserAgreementPageRequest : CommonPageQuery() {
    @ApiModelProperty("用户ID")
    var userId: String? = null

    @ApiModelProperty("开始时间戳")
    var startTime: Long? = null

    @ApiModelProperty("结束时间戳")
    var endTime: Long? = null
}
