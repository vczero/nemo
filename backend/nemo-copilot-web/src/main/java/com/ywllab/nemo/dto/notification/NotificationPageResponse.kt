package com.ywllab.nemo.dto.notification

import com.ywllab.nemo.constant.NotificationPriority
import com.ywllab.nemo.constant.NotificationStatus
import com.ywllab.nemo.constant.NotificationType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("通知分页查询响应")
class NotificationPageResponse {

    @ApiModelProperty("通知ID")
    lateinit var notificationId: String

    @ApiModelProperty("接收用户ID")
    var userId: String? = null

    @ApiModelProperty("接收用户名称")
    var userName: String = ""

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

    @ApiModelProperty("跳转链接")
    var linkUrl: String? = null

    @ApiModelProperty("关联业务ID")
    var linkId: String? = null

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("已读时间")
    var readTime: Long? = null
}
