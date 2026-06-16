package com.ywllab.nemo.dto.token

import com.ywllab.nemo.constant.ComputeType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("Token消耗记录详情")
class TokenUsageRecordDetailDto {
    @ApiModelProperty("记录ID")
    lateinit var recordId: String

    @ApiModelProperty("账户ID")
    lateinit var accountId: String

    @ApiModelProperty("关联订单ID")
    var orderId: String? = null

    @ApiModelProperty("产品ID")
    var productId: String? = null

    @ApiModelProperty("消耗Token数量")
    var usedAmount: Long = 0

    @ApiModelProperty("消耗前余额")
    var balanceBefore: Long = 0

    @ApiModelProperty("消耗后余额")
    var balanceAfter: Long = 0

    @ApiModelProperty("业务类型")
    lateinit var bizType: ComputeType

    @ApiModelProperty("业务ID")
    var bizId: String? = null

    @ApiModelProperty("备注")
    var remark: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0

    @ApiModelProperty("创建人")
    lateinit var createBy: String
}
