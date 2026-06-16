package com.ywllab.nemo.dto.notification

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("发送通知响应")
class NotificationSendResponse {

    @ApiModelProperty("发送成功的通知数量")
    var count: Int = 0

    @ApiModelProperty("是否发送给所有用户")
    var isAllUsers: Boolean = true

    @ApiModelProperty("响应消息")
    var message: String = ""

    companion object {
        fun of(count: Int, isAllUsers: Boolean, message: String): NotificationSendResponse {
            return NotificationSendResponse().apply {
                this.count = count
                this.isAllUsers = isAllUsers
                this.message = message
            }
        }
    }
}
