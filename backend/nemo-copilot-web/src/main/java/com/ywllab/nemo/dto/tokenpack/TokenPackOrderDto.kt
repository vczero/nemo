package com.ywllab.nemo.dto.tokenpack

import com.ywllab.nemo.model.Order
import com.ywllab.nemo.model.Product
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("流量包订单DTO")
class TokenPackOrderDto {
    @ApiModelProperty("订单ID")
    var orderId: String = ""

    @ApiModelProperty("订单编号")
    var orderNo: String = ""

    @ApiModelProperty("产品名称")
    var productName: String = ""

    @ApiModelProperty("初始数量")
    var tokenInitialAmount: Long = 0L

    @ApiModelProperty("已使用")
    var tokenUsedAmount: Long = 0L

    @ApiModelProperty("剩余数量")
    var tokenRemainingAmount: Long = 0L

    @ApiModelProperty("过期时间")
    var expireTime: Long = 0L

    @ApiModelProperty("状态")
    var status: String = ""

    @ApiModelProperty("状态描述")
    var statusDesc: String = ""

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("支付时间")
    var paidTime: Long? = null

    @ApiModelProperty("实付金额")
    var payAmount: Double = 0.0

    companion object {
        fun from(order: Order, product: Product?, usedAmount: Long): TokenPackOrderDto {
            return TokenPackOrderDto().apply {
                orderId = order.orderId
                orderNo = order.orderNo
                productName = product?.productName ?: ""
                tokenInitialAmount = product?.tokenAmount?.toLong() ?: 0L
                tokenUsedAmount = usedAmount
                tokenRemainingAmount = order.tokenRemainingAmount
                expireTime = order.expireTime
                status = order.tokenPackStatus?.name ?: ""
                statusDesc = order.tokenPackStatus?.description ?: ""
                createTime = order.createTime
                paidTime = order.paidTime
                payAmount = order.payAmount
            }
        }
    }
}
