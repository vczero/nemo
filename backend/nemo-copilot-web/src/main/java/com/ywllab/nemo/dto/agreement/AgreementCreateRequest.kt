package com.ywllab.nemo.dto.agreement

import com.ywllab.nemo.constant.AgreementType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("创建协议请求")
class AgreementCreateRequest {
    @ApiModelProperty("协议类型")
    var type: AgreementType = AgreementType.USER_AGREEMENT

    @ApiModelProperty("版本号")
    lateinit var version: String

    @ApiModelProperty("标题")
    lateinit var title: String

    @ApiModelProperty("协议内容")
    lateinit var content: String

    @ApiModelProperty("是否设为激活版本：0-不激活, 1-激活")
    var isActive: Int = 0
}
