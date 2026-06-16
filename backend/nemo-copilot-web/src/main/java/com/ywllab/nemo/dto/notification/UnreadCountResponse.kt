package com.ywllab.nemo.dto.notification

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("未读数量响应")
class UnreadCountResponse {

    @ApiModelProperty("未读总数")
    var total: Long = 0L
}
