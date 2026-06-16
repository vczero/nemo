package com.ywllab.nemo.dto.notification

import com.ywllab.nemo.constant.NotificationOperation
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("批量操作请求")
class NotificationBatchRequest {

    @ApiModelProperty("通知ID列表", required = true)
    lateinit var notificationIds: List<String>

    @ApiModelProperty("操作类型", required = true)
    lateinit var operation: NotificationOperation
}
