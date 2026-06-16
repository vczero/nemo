package com.ywllab.nemo.dto.channel

import com.ywllab.nemo.constant.ChannelOrderStatus
import com.ywllab.nemo.dto.PageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("渠道订单分页查询请求")
class ChannelOrderPageParam : PageQuery() {

    @ApiModelProperty("渠道订单状态")
    var status: ChannelOrderStatus? = null

    @ApiModelProperty("用户邮箱")
    var email: String? = null

    @ApiModelProperty("渠道订单号")
    var channelOrderNo: String? = null

    @ApiModelProperty("发放开始时间")
    var startTime: Long? = null

    @ApiModelProperty("发放结束时间")
    var endTime: Long? = null
}
