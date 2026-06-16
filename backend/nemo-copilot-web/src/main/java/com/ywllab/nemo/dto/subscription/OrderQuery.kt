package com.ywllab.nemo.dto.subscription

import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.dto.CommonPageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("订单查询条件")
class OrderQuery : CommonPageQuery() {

    @ApiModelProperty("订单状态")
    var status: OrderStatus? = null

    @ApiModelProperty("用户ID")
    var userId: String? = null

    @ApiModelProperty("产品ID")
    var productId: String? = null

    @ApiModelProperty("套餐ID")
    var planId: String? = null

    @ApiModelProperty("开始时间戳")
    var startTime: Long? = null

    @ApiModelProperty("结束时间戳")
    var endTime: Long? = null
}
