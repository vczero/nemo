package com.ywllab.nemo.dto.account

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("年度积分使用情况")
class AnnualPointsResponse {

    @ApiModelProperty("年度")
    var year: Int = 0

    @ApiModelProperty("已使用积分")
    var used: Int = 0

    @ApiModelProperty("年度限制")
    var limit: Int = 0

    @ApiModelProperty("剩余可用")
    var remaining: Int = 0
}
