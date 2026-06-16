package com.ywllab.nemo.dto.payment

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("支付宝配置")
class AlipayConfigDto {

    @ApiModelProperty("应用ID")
    var appId: String = ""

    @ApiModelProperty("商户私钥")
    var privateKey: String = ""

    @ApiModelProperty("商户公钥")
    var publicKey: String = ""

    @ApiModelProperty("支付宝公钥")
    var aliPayPublicKey: String = ""

    @ApiModelProperty("回调通知URL")
    var notifyUrl: String = ""

    @ApiModelProperty("支付成功后跳转URL")
    var returnUrl: String = ""

    @ApiModelProperty("是否启用")
    var enabled: Boolean = false

    companion object {
        const val SERVER_URL = "https://openapi.alipay.com/gateway.do"
        const val SERVER_URL_DEV = "https://openapi-sandbox.dl.alipaydev.com/gateway.do"
        const val CHARSET = "utf-8"
        const val SIGN_TYPE: String = "RSA2"
    }
}
