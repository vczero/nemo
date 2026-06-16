package com.ywllab.nemo.dto.subscription

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订阅功能")
class SubscriptionFeatureDto {
    @ApiModelProperty("名称")
    var name: String = ""

    @ApiModelProperty("标题")
    var title: String = ""

    @ApiModelProperty("描述")
    var description: String = ""
}
