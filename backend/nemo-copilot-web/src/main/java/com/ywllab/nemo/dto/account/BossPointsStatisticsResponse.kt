package com.ywllab.nemo.dto.account

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("积分统计")
class BossPointsStatisticsResponse {
    @ApiModelProperty("当前余额")
    var balance: Int = 0

    @ApiModelProperty("累计获得")
    var totalEarned: Int = 0

    @ApiModelProperty("累计使用")
    var totalUsed: Int = 0

    @ApiModelProperty("本年累计使用")
    var annualUsed: Int = 0
}
