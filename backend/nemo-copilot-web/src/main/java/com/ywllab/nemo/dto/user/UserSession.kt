package com.ywllab.nemo.dto.user

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@ApiModel("用户会话")
class UserSession : Serializable {

    companion object {
        private const val serialVersionUID = 25944878208630207L
        const val USER_SESSION = "USER_SESSION"
    }

    @ApiModelProperty("用户ID")
    lateinit var userId: String

    @ApiModelProperty("用户名")
    lateinit var username: String

    @ApiModelProperty("昵称")
    var nickname: String? = null

    @ApiModelProperty("邮箱")
    var email: String? = null

    @ApiModelProperty("头像URL")
    var avatarUrl: String? = null

    @ApiModelProperty("机构")
    var organization: String? = null
}
