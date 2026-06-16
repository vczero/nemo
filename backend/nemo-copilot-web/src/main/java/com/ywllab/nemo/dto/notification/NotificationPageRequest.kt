package com.ywllab.nemo.dto.notification

import com.ywllab.nemo.constant.NotificationPriority
import com.ywllab.nemo.constant.NotificationStatus
import com.ywllab.nemo.constant.NotificationType
import com.ywllab.nemo.dto.CommonPageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("通知分页查询请求")
class NotificationPageRequest : CommonPageQuery() {

    @ApiModelProperty("类型")
    var types: List<NotificationType> = listOf()

    @ApiModelProperty("状态")
    var status: List<NotificationStatus> = listOf(NotificationStatus.UNREAD)

    @ApiModelProperty("优先级")
    var priority: NotificationPriority? = null

    @ApiModelProperty("用户ID")
    var targetUserId: String? = null

    @ApiModelProperty("开始时间戳")
    var startTime: Long? = null

    @ApiModelProperty("结束时间戳")
    var endTime: Long? = null
}
