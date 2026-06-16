package com.ywllab.nemo.dto.chat.context

import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.dto.chat.ChatRequest
import io.swagger.annotations.ApiModelProperty

class ContextChatRequest : ChatRequest() {

    @ApiModelProperty("指定本次请求使用上下文缓存的 ID。在使用接口创建缓存时，从返回信息中获得。", required = true)
    @JsonProperty("context_id")
    lateinit var contextId: String
}
