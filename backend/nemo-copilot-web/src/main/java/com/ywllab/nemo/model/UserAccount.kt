package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户账户")
class UserAccount : BaseColumn() {
    @ApiModelProperty("账户ID")
    lateinit var accountId: String

    @ApiModelProperty("关联用户ID")
    lateinit var userId: String

    @ApiModelProperty("Token可用余额（单位：毫，1元=1000）")
    var tokenBalance: Long = 0

    @ApiModelProperty("Token冻结金额（单位：毫，1元=1000）")
    var tokenFrozen: Long = 0

    @ApiModelProperty("积分余额")
    var pointsBalance: Int = 0

    @ApiModelProperty("累计已使用积分")
    var pointsUsed: Int = 0

    @ApiModelProperty("当前订阅套餐ID")
    var currentPlanId: String? = null

    @ApiModelProperty("订阅到期时间")
    var subscriptionEndTime: Long? = null

    @ApiModelProperty("月度订阅token余额（每月1号清零重置）")
    var subscribeTokenBalance: Long = 0L

    @ApiModelProperty("月度订阅token配额（每月发放量）")
    var subscribeTokenQuota: Long = 0L
}
