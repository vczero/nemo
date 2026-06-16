package com.ywllab.nemo.model

import com.ywllab.nemo.constant.PointsRecordType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("积分记录")
class PointsRecord : BaseColumn() {
    @ApiModelProperty("记录ID")
    lateinit var recordId: String

    @ApiModelProperty("账户ID")
    lateinit var accountId: String

    @ApiModelProperty("积分变动（正数增加，负数减少）")
    var points: Int = 0

    @ApiModelProperty("变动前余额")
    var balanceBefore: Int = 0

    @ApiModelProperty("变动后余额")
    var balanceAfter: Int = 0

    @ApiModelProperty("类型")
    lateinit var type: PointsRecordType

    @ApiModelProperty("关联业务ID")
    var bizId: String? = null

    @ApiModelProperty("关联业务类型")
    var bizType: String? = null

    @ApiModelProperty("备注")
    var remark: String? = null
}
