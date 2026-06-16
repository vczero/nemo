package com.ywllab.nemo.dto.chat.context

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.dto.chat.ChatMessage
import io.swagger.annotations.ApiModelProperty

@JsonInclude(JsonInclude.Include.NON_NULL)
class ContextCreateRequest {

    @ApiModelProperty("模型ID", required = true)
    var model = ""

    @ApiModelProperty("消息列表", required = true)
    var messages = listOf<ChatMessage>()

    @ApiModelProperty("本次请求创建的上下文缓存的类型, 可选值: session（默认）, common_prefix")
    var mode: String? = null

    @ApiModelProperty("过期时长，单位为秒，设置范围：[3600, 604800]，即1小时到7天。默认值 86400")
    var ttl: Int? = null

    @ApiModelProperty("缓存的上下文长度的窗口长度策略配置，只在当 mode 字段设置为session，该字段可设置。")
    @JsonProperty("truncation_strategy")
    var truncationStrategy: Any? = null
}
