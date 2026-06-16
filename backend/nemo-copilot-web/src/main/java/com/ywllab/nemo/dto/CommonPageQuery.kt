package com.ywllab.nemo.dto

import cn.hutool.core.util.URLUtil
import io.swagger.annotations.ApiModelProperty

open class CommonPageQuery : PageQuery() {

    @ApiModelProperty("业务ID")
    var businessId: String = ""

    @ApiModelProperty("根据不同业务匹配不同的字段")
    var keyword: String = ""

    fun decodeKeyWord(): String {
        return URLUtil.decode(keyword)
    }
}
