package com.ywllab.nemo.dto.agreement

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户协议授权记录分页响应")
class UserAgreementPageResponse {
    @ApiModelProperty("授权记录ID")
    lateinit var agreementRecordId: String

    @ApiModelProperty("用户ID")
    lateinit var userId: String

    @ApiModelProperty("用户名")
    var username: String? = null

    @ApiModelProperty("用户邮箱")
    var email: String? = null

    @ApiModelProperty("协议ID")
    lateinit var agreementId: String

    @ApiModelProperty("协议版本")
    var agreementVersion: String = ""

    @ApiModelProperty("协议标题")
    var agreementTitle: String? = null

    @ApiModelProperty("IP地址")
    var ipAddress: String? = null

    @ApiModelProperty("浏览器信息")
    var userAgent: String? = null

    @ApiModelProperty("设备信息")
    var deviceInfo: String? = null

    @ApiModelProperty("授权时间")
    var createTime: Long = 0L
}
