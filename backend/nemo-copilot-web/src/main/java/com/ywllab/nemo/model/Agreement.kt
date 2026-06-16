package com.ywllab.nemo.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.constant.AgreementType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("协议")
class Agreement : BaseColumn() {
    @ApiModelProperty("ID")
    lateinit var agreementId: String

    @ApiModelProperty("协议类型")
    var type: AgreementType = AgreementType.USER_AGREEMENT

    @ApiModelProperty("版本号")
    var version: String = ""

    @ApiModelProperty("标题")
    var title: String = ""

    @ApiModelProperty("协议内容")
    lateinit var content: String

    @ApiModelProperty("OSS路径")
    var ossPath: String ? = null

    @ApiModelProperty("是否激活：0-未激活, 1-已激活")
    @JsonProperty("isActive")
    var isActive: Int = 0

    @ApiModelProperty("生效时间")
    var effectiveDate: Long? = null
}
