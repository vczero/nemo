package com.ywllab.nemo.dto.user

import com.ywllab.nemo.dto.account.AccountInfoResponse
import com.ywllab.nemo.dto.account.BossPointsStatisticsResponse
import com.ywllab.nemo.model.User
import com.ywllab.nemo.model.UserProfile
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户详情响应")
class BossUserDetail {
    @ApiModelProperty("用户基本信息")
    lateinit var user: User

    @ApiModelProperty("用户扩展信息")
    var profile: UserProfile? = null

    @ApiModelProperty("账户信息")
    var account: AccountInfoResponse? = null

    @ApiModelProperty("积分统计信息")
    var pointsStatistics: BossPointsStatisticsResponse? = null

    @ApiModelProperty("注册时间")
    var registerTime: Long? = null

    @ApiModelProperty("最后登录时间")
    var lastLoginTime: Long? = null

    @ApiModelProperty("最后登录IP")
    var lastLoginIp: String? = null

    @ApiModelProperty("用户状态")
    var status: String = "ACTIVE"

    @ApiModelProperty("是否锁定：0-未锁定 1-已锁定")
    var isLocked: Int = 0
}
