package com.ywllab.nemo.dto.compute.openai

import com.alibaba.fastjson.annotation.JSONField
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@ApiModel("response-api响应数据")
open class ResponseData : Serializable {

    @ApiModelProperty("响应ID")
    var id: String? = null

    @ApiModelProperty("对象类型")
    var `object`: String? = null

    @ApiModelProperty("创建时间戳（秒）")
    @JSONField(name = "created_at")
    var createdAt: Double = 0.0

    @ApiModelProperty("状态")
    var status: String? = null

    @ApiModelProperty("错误信息")
    var error: ResponseError? = null

    @ApiModelProperty("不完整详情")
    @JSONField(name = "incomplete_details")
    var incompleteDetails: IncompleteDetails? = null

    @ApiModelProperty("指令")
    var instructions: String? = null

    @ApiModelProperty("模型名称")
    var model: String? = null

    @ApiModelProperty("输出列表")
    var output: List<OutputItem>? = null

    @ApiModelProperty("并行工具调用")
    @JSONField(name = "parallel_tool_calls")
    var parallelToolCalls: Boolean = false

    @ApiModelProperty("温度")
    var temperature: Double? = null

    @ApiModelProperty("top_p")
    @JSONField(name = "top_p")
    var topP: Double? = null

    @ApiModelProperty("工具选择")
    @JSONField(name = "tool_choice")
    var toolChoice: String? = null

    @ApiModelProperty("工具列表")
    var tools: List<Any>? = null

    @ApiModelProperty("截断策略")
    var truncation: String? = null

    @ApiModelProperty("用量信息")
    var usage: ResponseUsage? = null

    @ApiModelProperty("用户")
    var user: String? = null

    @ApiModelProperty("元数据")
    var metadata: Map<String, Any>? = null

    companion object {
        private const val serialVersionUID: Long = -4185068410271857234L
    }

    /**
     * 输出项
     * {
     *     "type": "response.output_item.done",
     *     "sequence_number": 52,
     *     "output_index": 15,
     *     "item": {
     *         "id": "fc_ad626adcd3964c9b",
     *         "type": "function_call",
     *         "status": "completed",
     *         "call_id": "call_f67ff5af7a17419dae3e016d",
     *         "name": "render_chart",
     *         "arguments": {
     *             "chart_config": "{\"version\":\"v2\",\"type\":\"pie\",\"dataMapping\":{\"nameField\":\"city\",\"valueField\":\"temperature\"},\"title\":{\"text\":\"各城市气温占比分布\",\"show\":true},\"size\":{\"width\":640,\"height\":480},\"fontSize\":12,\"theme\":\"academy\",\"legend\":{\"show\":true,\"position\":\"bottom\"},\"label\":{\"show\":true,\"format\":\"percentage\"},\"chartSetting\":{\"radius\":50,\"innerRadius\":0,\"showLabelName\":true}}",
     *             "chart_data": "[[\"city\",\"temperature\"],[\"北京\",26],[\"上海\",28],[\"广州\",30],[\"深圳\",29],[\"杭州\",27],[\"成都\",25],[\"武汉\",28],[\"南京\",26]]"
     *         }
     *     }
     * }
     */
    @ApiModel("输出项")
    open class OutputItem : Serializable {

        @ApiModelProperty("Item ID")
        var id: String? = null

        @ApiModelProperty("Item Name")
        var name: String? = null

        @ApiModelProperty("输出类型")
        var type: String? = null

        @ApiModelProperty("状态")
        var status: String? = null

        @ApiModelProperty("角色")
        var role: String? = null

        @ApiModelProperty("内容列表")
        var content: List<ContentPart>? = null

        @ApiModelProperty("推理")
        var summary: List<ResponseReasoningSummaryEvent.ReasoningSummary>? = null

        @ApiModelProperty("原因")
        var reason: String? = null

        companion object {
            private const val serialVersionUID: Long = -5834728401920367231L

            fun default(answer: String): OutputItem {
                return OutputItem().apply {
                    type = "message"
                    role = "assistant"
                    content = listOf(
                        ContentPart().apply {
                            type = "output_text"
                            text = answer
                        }
                    )
                }
            }
        }

        /**
         * 内容部分
         */
        @ApiModel("内容部分")
        open class ContentPart : Serializable {

            @ApiModelProperty("内容类型")
            var type: String? = null

            @ApiModelProperty("文本内容")
            var text: String? = null

            @ApiModelProperty("注解列表")
            var annotations: List<Any>? = null

            companion object {
                private const val serialVersionUID: Long = 2893475829347293847L
            }
        }
    }

    /**
     * 不完整详情
     */
    @ApiModel("不完整详情")
    open class IncompleteDetails : Serializable {

        @ApiModelProperty("原因")
        var reason: String? = null

        companion object {
            private const val serialVersionUID: Long = -7123847592384758234L
        }
    }

    /**
     * 错误信息
     */
    @ApiModel("响应错误")
    open class ResponseError : Serializable {

        @ApiModelProperty("错误码")
        var code: String? = null

        @ApiModelProperty("错误信息")
        var message: String? = null

        @ApiModelProperty("错误类型")
        var type: String? = null

        companion object {
            private const val serialVersionUID: Long = 3847592837459237459L
        }
    }

    /**
     * 用量信息
     */
    @ApiModel("响应用量")
    open class ResponseUsage : Serializable {

        @ApiModelProperty("输入 tokens")
        @JSONField(name = "input_tokens")
        var inputTokens: Int = 0

        @ApiModelProperty("输出 tokens")
        @JSONField(name = "output_tokens")
        var outputTokens: Int = 0

        @ApiModelProperty("总 tokens")
        @JSONField(name = "total_tokens")
        var totalTokens: Int = 0

        @ApiModelProperty("输入令牌详情")
        @JSONField(name = "input_tokens_details")
        var inputTokensDetails: InputTokensDetails? = null

        @ApiModelProperty("输出令牌详情")
        @JSONField(name = "output_tokens_details")
        var outputTokensDetails: OutputTokensDetails? = null

        @ApiModelProperty("扩展详情")
        var xDetails: List<Map<String, Any>>? = null

        companion object {
            private const val serialVersionUID: Long = -2934875923857432958L
        }

        @ApiModel("输入令牌详情")
        open class InputTokensDetails : Serializable {

            @ApiModelProperty("缓存命中 tokens")
            @JSONField(name = "cached_tokens")
            var cachedTokens: Int = 0

            companion object {
                private const val serialVersionUID: Long = 6574839203847592834L
            }
        }

        @ApiModel("输出令牌详情")
        open class OutputTokensDetails : Serializable {

            @ApiModelProperty("推理 tokens")
            @JSONField(name = "reasoning_tokens")
            var reasoningTokens: Int = 0

            companion object {
                private const val serialVersionUID: Long = -4857392847592837459L
            }
        }
    }
}
