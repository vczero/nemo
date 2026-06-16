package com.ywllab.nemo.dto.notification

import com.ywllab.nemo.constant.NotificationPriority
import com.ywllab.nemo.constant.NotificationType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("创建通知请求")
class NotificationCreateRequest {

    @ApiModelProperty("接收用户ID", required = true)
    lateinit var userId: String

    @ApiModelProperty("通知类型：SYSTEM, INVITATION, CHART, COMMENT, REMINDER", required = true)
    lateinit var type: NotificationType

    @ApiModelProperty("通知标题", required = true)
    lateinit var title: String

    @ApiModelProperty("通知内容", required = true)
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
