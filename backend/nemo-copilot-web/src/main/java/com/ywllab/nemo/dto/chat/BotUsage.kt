package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModelProperty

@JsonInclude(JsonInclude.Include.NON_NULL)
class BotUsage {

    @ApiModelProperty("本次请求不同 endpoint 的 token 消耗。")
    @JsonProperty("model_usage")
    var modeUsage: List<Usage>? = null
}
