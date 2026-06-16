package com.ywllab.nemo.dto.notification

import com.ywllab.nemo.constant.NotificationPriority
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import javax.validation.constraints.NotNull

@ApiModel("发送通知请求")
class NotificationSendRequest {

    @ApiModelProperty("接收用户ID列表，为空则发送给所有用户", required = false)
    var userIds: List<String>? = null

    @ApiModelProperty("通知标题", required = true)
    @NotNull(message = "通知标题不能为空")
    lateinit var title: String

    @ApiModelProperty("通知内容", required = true)
    @NotNull(message = "通知内容不能为空")
    lateinit var content: String

    @ApiModelProperty("优先级：NORMAL, IMPORTANT, URGENT")
    var priority: NotificationPriority = NotificationPriority.NORMAL

    @ApiModelProperty("跳转链接")
    var linkUrl: String? = null

    @ApiModelProperty("关联业务ID")
    var linkId: String? = null

    @ApiModelProperty("扩展数据（JSON格式）")
    var extData: String? = null
}
