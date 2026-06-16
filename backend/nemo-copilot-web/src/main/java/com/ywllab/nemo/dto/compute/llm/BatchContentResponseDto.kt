package com.ywllab.nemo.dto.compute.llm

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * 输出文件行
 * {
 *   "id" : "8242797e-3cef-477c-bb41-dfe731b8e6a7",
 *   "custom_id" : "2048410132433575936-1",
 *   "response" : {
 *     "status_code" : 200,
 *     "request_id" : "8242797e-3cef-477c-bb41-dfe731b8e6a7",
 *     "body" : {
 *       "created" : 1777215672,
 *       "usage" : {
 *         "completion_tokens" : 2,
 *         "prompt_tokens" : 68,
 *         "total_tokens" : 70
 *       },
 *       "model" : "qwen-plus",
 *       "id" : "chatcmpl-8242797e-3cef-477c-bb41-dfe731b8e6a7",
 *       "choices" : [ {
 *         "finish_reason" : "stop",
 *         "index" : 0,
 *         "message" : {
 *           "role" : "assistant",
 *           "content" : "春风得意"
 *         }
 *       } ],
 *       "object" : "chat.completion"
 *     }
 *   },
 *   "error" : null
 * }
 */
@ApiModel("response批量异步计算的content")
class BatchContentResponseDto {
    @ApiModelProperty("批次ID")
    lateinit var id: String

    @ApiModelProperty("自定义ID")
    lateinit var customId: String

    @ApiModelProperty("响应内容")
    lateinit var response: BatchResponse

    @ApiModelProperty("错误信息")
    var error: Any? = null

    class BatchResponse {
        @ApiModelProperty("状态码")
        var statusCode: Int = 0

        @ApiModelProperty("请求ID")
        lateinit var requestId: String

        @ApiModelProperty("响应体")
        lateinit var body: Body

        class Body {
            @ApiModelProperty("创建时间戳")
            var created: Long = 0

            @ApiModelProperty("token使用量")
            lateinit var usage: Usage

            @ApiModelProperty("模型名称")
            lateinit var model: String

            @ApiModelProperty("对话ID")
            lateinit var id: String

            @ApiModelProperty("回复选择")
            lateinit var choices: List<Choice>

            @ApiModelProperty("对象类型")
            lateinit var `object`: String

            class Usage {
                @ApiModelProperty("完成token数")
                var completionTokens: Int = 0

                @ApiModelProperty("提示token数")
                var promptTokens: Int = 0

                @ApiModelProperty("总token数")
                var totalTokens: Int = 0
            }

            class Choice {
                @ApiModelProperty("结束原因")
                lateinit var finishReason: String

                @ApiModelProperty("索引")
                var index: Int = 0

                @ApiModelProperty("消息内容")
                lateinit var message: Message

                class Message {
                    @ApiModelProperty("角色")
                    lateinit var role: String

                    @ApiModelProperty("内容")
                    lateinit var content: String
                }
            }
        }
    }
}
