package com.ywllab.nemo.dto.invitation

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("积分账户统计")
class PointAccountStats {

    @ApiModelProperty("邀请人数")
    var invitedCount: Int = 0

    @ApiModelProperty("已使用积分")
    var usedPoints: Int = 0

    @ApiModelProperty("获得总积分")
    var totalPoints: Int = 0

    @ApiModelProperty("积分余额")
    var pointBalance: Int = 0
}
