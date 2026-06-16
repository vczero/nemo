package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户协议授权记录")
class UserAgreement : BaseColumn() {
    @ApiModelProperty("ID")
    lateinit var agreementRecordId: String

    @ApiModelProperty("用户ID")
    lateinit var userId: String

    @ApiModelProperty("协议ID")
    lateinit var agreementId: String

    @ApiModelProperty("协议版本")
    var agreementVersion: String = ""

    @ApiModelProperty("IP地址")
    var ipAddress: String? = null

    @ApiModelProperty("浏览器信息")
    var userAgent: String? = null

    @ApiModelProperty("设备信息")
    var deviceInfo: String? = null
}
