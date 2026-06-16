package com.ywllab.nemo.dto.chat.context

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.dto.chat.Usage
import io.swagger.annotations.ApiModelProperty

@JsonInclude(JsonInclude.Include.NON_NULL)
class ContextCreateResult {

    @ApiModelProperty("本次请求创建的上下文缓存的ID，在后续创建带缓存的上下文缓存对话 API需要使用。")
    var id = ""

    @ApiModelProperty("模型ID")
    var model = ""

    @ApiModelProperty("本次请求创建的上下文缓存的类型, 可选值: session（默认）, common_prefix")
    var mode: String? = null

    @ApiModelProperty("过期时长，单位为秒，设置范围：[3600, 604800]，即1小时到7天。默认值 86400")
    var ttl: Int? = null

    @ApiModelProperty("缓存的上下文长度的窗口长度策略配置，只在当 mode 字段设置为session，该字段可设置。")
    @JsonProperty("truncation_strategy")
    var truncationStrategy: Any? = null

    @ApiModelProperty("本次请求的 token 用量")
    var usage: Usage? = null
}
