package com.ywllab.nemo.dto.agreement

import com.ywllab.nemo.constant.AgreementType
import com.ywllab.nemo.dto.CommonPageQuery
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("协议分页查询请求")
class AgreementPageRequest : CommonPageQuery() {
    @ApiModelProperty("协议类型")
    var type: AgreementType? = null

    @ApiModelProperty("是否激活：0-未激活, 1-已激活")
    var isActive: Int? = null
}
