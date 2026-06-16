package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@JsonInclude(JsonInclude.Include.NON_NULL)
class Usage : Serializable {

    @ApiModelProperty("输入的 prompt token 数量")
    @JsonProperty("prompt_tokens")
    var promptTokens: Long = 0

    @ApiModelProperty("模型生成的 token 数量")
    @JsonProperty("completion_tokens")
    var completionTokens: Long = 0

    @ApiModelProperty("本次请求消耗的总 token 数量（输入 + 输出）")
    @JsonProperty("total_tokens")
    var totalTokens: Long = 0

    @ApiModelProperty("用户 prompt 中，命中上下文缓存的 token 数。（deepseek）")
    @JsonProperty("prompt_cache_hit_tokens")
    var promptCacheHitTokens: Long? = null

    @ApiModelProperty("用户 prompt 中，未命中上下文缓存的 token 数。（deepseek）")
    @JsonProperty("prompt_cache_miss_tokens")
    var promptCacheMissTokens: Long? = null

    @ApiModelProperty("tokens（volc）")
    @JsonProperty("prompt_tokens_details")
    var promptTokensDetails: PromptTokensDetails? = null

    class PromptTokensDetails {

        @ApiModelProperty("提示词命中缓存的 token 用量。（volc）")
        @JsonProperty("cached_tokens")
        var cachedTokens: Long? = null
    }
    companion object {
        private const val serialVersionUID: Long = 6820293433762825659L
    }
}
