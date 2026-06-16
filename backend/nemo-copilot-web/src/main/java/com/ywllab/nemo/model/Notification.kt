package com.ywllab.nemo.model

import com.ywllab.nemo.constant.NotificationPriority
import com.ywllab.nemo.constant.NotificationStatus
import com.ywllab.nemo.constant.NotificationType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("通知")
class Notification : BaseColumn() {
    @ApiModelProperty("通知ID")
    lateinit var notificationId: String

    @ApiModelProperty("接收用户ID")
    var userId: String = ""

    @ApiModelProperty("通知类型")
    var type: NotificationType = NotificationType.SYSTEM

    @ApiModelProperty("通知标题")
    var title: String = ""

    @ApiModelProperty("通知内容")
    var content: String = ""

    @ApiModelProperty("优先级")
    var priority: NotificationPriority = NotificationPriority.NORMAL

    @ApiModelProperty("状态")
    var status: NotificationStatus = NotificationStatus.UNREAD

    @ApiModelProperty("已读时间")
    var readTime: Long? = null

    @ApiModelProperty("跳转链接")
    var linkUrl: String? = null

    @ApiModelProperty("关联业务ID")
    var linkId: String? = null

    @ApiModelProperty("扩展数据（JSON格式）")
    var extData: String? = null
}
