package com.ywllab.nemo.model

import io.swagger.annotations.ApiModelProperty

open class BaseColumn {
    @ApiModelProperty("创建人")
    var createBy: String = ""

    @ApiModelProperty("修改人")
    var updateBy: String = ""

    @ApiModelProperty("创建时间")
    var createTime: Long = 0L

    @ApiModelProperty("修改时间")
    var updateTime: Long = 0L
}
