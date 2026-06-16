package com.ywllab.nemo.dto.account

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("积分调整请求")
class PointsAdjustRequest {
    @ApiModelProperty("积分变动（正数增加，负数减少）")
    var points: Int = 0

    @ApiModelProperty("备注")
    var remark: String? = null
}
