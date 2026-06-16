package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@ApiModel("是否开启实时搜索功能（baidu用此字段）")
class WebSearch : Serializable {

    @ApiModelProperty("是否开启实时搜索功能")
    var enable = true

    @ApiModelProperty("是否开启上角标返回")
    @JsonProperty("enable_citation")
    var enableCitation = false

    @ApiModelProperty("是否返回搜索溯源信息")
    @JsonProperty("enable_trace")
    var enableTrace = false

    @ApiModelProperty("是否返回搜索信号")
    @JsonProperty("enable_status")
    var enableStatus = false

    companion object {
        private const val serialVersionUID: Long = 3729402829733811852L
    }
}
