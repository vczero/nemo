package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModel

@ApiModel("是否包含本次请求的 token 用量统计信息")
class StreamOptions {

    @JsonProperty("include_usage")
    var includeUsage: Boolean = true
}
