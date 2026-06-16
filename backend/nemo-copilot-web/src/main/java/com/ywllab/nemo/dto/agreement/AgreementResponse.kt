package com.ywllab.nemo.dto.agreement

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.AgreementType
import com.ywllab.nemo.model.BaseColumn
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("协议详情响应")
class AgreementResponse : BaseColumn() {
    @ApiModelProperty("协议ID")
    lateinit var agreementId: String

    @ApiModelProperty("协议类型")
    var type: AgreementType = AgreementType.USER_AGREEMENT

    @ApiModelProperty("版本号")
    var version: String = ""

    @ApiModelProperty("标题")
    var title: String = ""

    @ApiModelProperty("协议内容")
    var content: String = ""

    @ApiModelProperty("是否激活")
    @JsonProperty("isActive")
    var isActive: Int = 0

    @ApiModelProperty("生效时间")
    var effectiveDate: Long? = null
}
