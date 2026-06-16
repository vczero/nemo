package com.ywllab.nemo.dto.chat

import com.fasterxml.jackson.annotation.JsonAlias
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import com.ywllab.nemo.dto.chat.tool.ChatTool
import io.swagger.annotations.ApiModelProperty

@JsonInclude(JsonInclude.Include.NON_NULL)
open class ChatRequest {

    @ApiModelProperty("模型ID", required = true)
    var model = ""

    @ApiModelProperty("消息列表", required = true)
    var messages = listOf<ChatMessage>()

    @ApiModelProperty("采样温度")
    var temperature: Double? = null

    @ApiModelProperty("核采样概率阈值")
    @JsonAlias("topP")
    @JsonProperty("top_p")
    var topP: Double? = null

    @ApiModelProperty("响应内容是否流式返回")
    var stream: Boolean = false

    @ApiModelProperty("是否开启实时搜索功能")
    @JsonAlias("enableSearch")
    @JsonProperty("enable_search")
    var enableSearch: Boolean? = null

    @ApiModelProperty("是否开启实时搜索功能（baidu用此字段）")
    @JsonProperty("web_search")
    var webSearch: WebSearch? = null

    @ApiModelProperty("返回内容的格式")
    @JsonProperty("response_format")
    var responseFormat: ChatResponseFormat? = null

    @ApiModelProperty("模型回复最大长度（单位 token）")
    @JsonAlias("maxTokens")
    @JsonProperty("max_tokens")
    var maxTokens: Int? = null

    @ApiModelProperty("当do_sample为true时，启用采样策略；当do_sample为false时，温度和top_p等采样策略参数将不生效。默认值为true。")
    @JsonAlias("doSample")
    @JsonProperty("do_sample")
    var doSample: Boolean? = null

    @ApiModelProperty("是否包含本次请求的 token 用量统计信息")
    @JsonProperty("stream_options")
    var streamOptions: StreamOptions? = null

    @ApiModelProperty("可供模型调用的工具数组，可以包含一个或多个工具对象。一次Function Calling流程模型会从中选择一个工具。")
    var tools: List<ChatTool>? = null

    @ApiModelProperty("是否开启思考模式（aliyun）")
    @JsonProperty("enable_thinking")
    var enableThinking: Boolean? = null

    @ApiModelProperty("控制大模型是否开启思维链。（zhipu）")
    var thinking: Thinking? = null

    @ApiModelProperty("是否返回输出 tokens 的对数概率。")
    var logprobs: Boolean? = null

    @ApiModelProperty("指定每个输出 token 位置最有可能返回的 token 数量，每个 token 都有关联的对数概率。仅当 logprobs为true 时可以设置 top_logprobs 参数。")
    @JsonProperty("top_logprobs")
    var topLogprobs: Int? = null

    @ApiModelProperty("调整指定 token 在模型输出内容中出现的概率，使模型生成的内容更加符合特定的偏好。")
    @JsonProperty("logit_bias")
    var logitBias: Map<String, Double>? = null

    @ApiModelProperty("chat template 渲染时传入的额外参数，用于控制模板行为（如 enable_thinking 等）")
    @JsonProperty("chat_template_kwargs")
    var chatTemplateKwargs: Any? = null

    class Thinking {
        @ApiModelProperty("是否开启思考模式, 可选值: enabled, disabled")
        var type: String? = null
    }

    constructor()
    constructor(model: String) {
        this.model = model
    }
}
