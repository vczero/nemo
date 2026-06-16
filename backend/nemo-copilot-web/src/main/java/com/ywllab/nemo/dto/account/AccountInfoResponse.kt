package com.ywllab.nemo.dto.account

import com.ywllab.nemo.constant.SubscriptionStatus
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("账户信息响应")
class AccountInfoResponse {
    @ApiModelProperty("账户ID")
    var accountId: String = ""

    @ApiModelProperty("用户ID")
    var userId: String = ""

    @ApiModelProperty("Token可用余额（单位：毫，1元=1000）")
    var tokenBalance: Long = 0

    @ApiModelProperty("Token冻结金额（单位：毫，1元=1000）")
    var tokenFrozen: Long = 0

    @ApiModelProperty("积分余额")
    var pointsBalance: Int = 0

    @ApiModelProperty("当前订阅套餐ID")
    var currentPlanId: String? = null

    @ApiModelProperty("订阅到期时间")
    var subscriptionEndTime: Long? = null

    @ApiModelProperty("订阅状态")
    var subscriptionStatus: SubscriptionStatus = SubscriptionStatus.NONE
}
