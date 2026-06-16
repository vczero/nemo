package com.ywllab.nemo.dto.agreement

import com.ywllab.nemo.constant.AgreementType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("最新协议URL响应")
class AgreementUrlResponse {
    @ApiModelProperty("协议ID")
    lateinit var agreementId: String

    @ApiModelProperty("协议类型")
    lateinit var type: AgreementType

    @ApiModelProperty("协议标题")
    lateinit var title: String

    @ApiModelProperty("协议内容URL")
    lateinit var url: String
}
