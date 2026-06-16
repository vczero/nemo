package com.ywllab.nemo.dto.compute.openai

import com.alibaba.fastjson.annotation.JSONField
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@ApiModel("Response API 请求参数")
open class ResponseParam : Serializable {

    @ApiModelProperty("模型名称")
    var model: String? = null

    @ApiModelProperty("指令")
    var instructions: String? = null

    @ApiModelProperty("输入内容")
    var input: Any? = null

    @ApiModelProperty("是否流式")
    var stream: Boolean = false

    @ApiModelProperty("并行工具调用")
    @JSONField(name = "parallel_tool_calls")
    var parallelToolCalls: Boolean? = null

    @ApiModelProperty("最大输出 tokens")
    @JSONField(name = "max_output_tokens")
    var maxOutputTokens: Int? = null

    @ApiModelProperty("温度")
    var temperature: Double? = null

    @ApiModelProperty("top_p")
    var topP: Double? = null

    @ApiModelProperty("工具列表")
    var tools: List<Map<String, Any>>? = null

    @ApiModelProperty("工具选择")
    @JSONField(name = "tool_choice")
    var toolChoice: String? = null

    @ApiModelProperty("截断策略")
    var truncation: String? = null

    @ApiModelProperty("响应格式")
    var response: Map<String, Any>? = null

    @ApiModelProperty("Store")
    var store: Boolean? = null

    @ApiModelProperty("用户")
    var user: String? = null

    companion object {
        private const val serialVersionUID: Long = -5847293847583927483L
    }
}
