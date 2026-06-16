package com.ywllab.nemo.dto.account

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户大模型流量情况")
class TokenAccount {
    @ApiModelProperty("Token可用流量")
    var tokenBalance: Long = 0

    @ApiModelProperty("Token冻结金额")
    var tokenFrozen: Long = 0
}
