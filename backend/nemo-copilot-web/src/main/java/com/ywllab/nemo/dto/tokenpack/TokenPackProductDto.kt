package com.ywllab.nemo.dto.tokenpack

import com.ywllab.nemo.model.Product
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("流量包产品DTO")
class TokenPackProductDto {
    @ApiModelProperty("产品ID")
    var productId: String = ""

    @ApiModelProperty("产品名称")
    var productName: String = ""

    @ApiModelProperty("Token数量")
    var tokenAmount: Long = 0L

    @ApiModelProperty("有效期天数")
    var validityDays: Int = 30

    @ApiModelProperty("原价")
    var originalPrice: Double = 0.0

    @ApiModelProperty("现价")
    var currentPrice: Double = 0.0

    companion object {
        fun from(product: Product): TokenPackProductDto {
            return TokenPackProductDto().apply {
                productId = product.productId
                productName = product.productName
                tokenAmount = product.tokenAmount?.toLong() ?: 0L
                validityDays = product.validityDays ?: 30
                originalPrice = product.originalPrice
                currentPrice = product.currentPrice
            }
        }
    }
}
