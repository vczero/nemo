package com.ywllab.nemo.dto.notification

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import javax.validation.constraints.NotEmpty

@ApiModel("通知ID列表请求")
class NotificationIdsRequest {

    @ApiModelProperty("通知ID列表", required = true)
    @NotEmpty(message = "通知ID列表不能为空")
    var notificationIds: List<String> = emptyList()
}
