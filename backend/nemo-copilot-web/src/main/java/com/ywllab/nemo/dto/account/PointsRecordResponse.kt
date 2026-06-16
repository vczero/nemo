package com.ywllab.nemo.dto.account

import com.ywllab.nemo.constant.PointsRecordType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("积分记录响应")
class PointsRecordResponse {
    @ApiModelProperty("记录ID")
    var recordId: String = ""

    @ApiModelProperty("积分变动")
    var points: Int = 0

    @ApiModelProperty("类型")
    lateinit var type: PointsRecordType

    @ApiModelProperty("类型名称")
    var typeName: String = ""

    @ApiModelProperty("变动后余额")
    var balanceAfter: Int = 0

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0
}
