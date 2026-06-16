package com.ywllab.nemo.dto.compute.openai

import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.annotation.JSONField
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

// ==================== SSE 事件基类 ====================

/**
 * SSE 流式事件基类
 * 根据 event type 动态解析为具体的子类
 */
@ApiModel("SSE流式事件")
open class ResponseStreamEvent : Serializable {
    @ApiModelProperty("事件类型")
    var type: String? = null

    companion object {
        /**
         * 从 SSE data 字符串解析为具体事件类型
         */
        fun parse(data: String): ResponseStreamEvent {
            val json = JSON.parseObject(data)
            val eventType = json.getString("type") ?: ""

            return when (eventType) {
                "response.created" -> {
                    JSON.parseObject(data, ResponseCreatedEvent::class.java)
                }

                "response.completed" -> {
                    JSON.parseObject(data, ResponseCompletedEvent::class.java)
                }

                "response.incomplete" -> {
                    JSON.parseObject(data, ResponseIncompleteEvent::class.java)
                }

                "response.in_progress" -> {
                    JSON.parseObject(data, ResponseInProgressEvent::class.java)
                }

                "response.text.delta" -> {
                    JSON.parseObject(data, ResponseTextDeltaEvent::class.java)
                }

                "response.text.done" -> {
                    JSON.parseObject(data, ResponseTextDoneEvent::class.java)
                }

                "response.output_text.delta" -> {
                    JSON.parseObject(data, ResponseOutputTextDeltaEvent::class.java)
                }

                "response.output_text.done" -> {
                    JSON.parseObject(data, ResponseOutputTextDoneEvent::class.java)
                }

                "response.content_part.added" -> {
                    JSON.parseObject(data, ResponseContentPartAddedEvent::class.java)
                }

                "response.content_part.done" -> {
                    JSON.parseObject(data, ResponseContentPartDoneEvent::class.java)
                }

                "response.output_item.added" -> {
                    JSON.parseObject(data, ResponseOutputItemAddedEvent::class.java)
                }

                "response.output_item.done" -> {
                    JSON.parseObject(data, ResponseOutputItemDoneEvent::class.java)
                }

                "response.reasoning_summary_part.added" -> {
                    JSON.parseObject(data, ResponseReasoningSummaryEvent::class.java)
                }

                "response.reasoning_text.delta" -> {
                    JSON.parseObject(data, ResponseReasoningTextDeltaEvent::class.java)
                }

                "response.reasoning_text.done" -> {
                    JSON.parseObject(data, ResponseReasoningTextDoneEvent::class.java)
                }

                "response.reasoning_summary_text.delta" -> {
                    JSON.parseObject(data, ResponseReasoningSummaryTextDeltaEvent::class.java)
                }

                "response.reasoning_summary_text.done" -> {
                    JSON.parseObject(data, ResponseReasoningSummaryTextDoneEvent::class.java)
                }

                // 兜底：未知类型返回自身
                else -> {
                    JSON.parseObject(data, ResponseStreamEvent::class.java)
                }
            } as ResponseStreamEvent
        }
    }
}

// ==================== 辅助数据结构 ====================

/**
 * 响应创建事件
 * type: response.created
 */
@ApiModel("响应创建事件")
open class ResponseCreatedEvent : ResponseStreamEvent() {

    @ApiModelProperty("响应对象")
    var response: ResponseData? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -3847592837459234857L
    }
}

/**
 * 响应完成事件
 * type: response.completed
 */
@ApiModel("响应完成事件")
open class ResponseCompletedEvent : ResponseStreamEvent() {

    @ApiModelProperty("响应对象")
    var response: ResponseData? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 7583928475829384758L
    }
}

/**
 * 响应不完整事件
 * type: response.incomplete
 */
@ApiModel("响应不完整事件")
open class ResponseIncompleteEvent : ResponseStreamEvent() {

    @ApiModelProperty("响应对象")
    var response: ResponseData? = null

    @ApiModelProperty("不完整详情")
    var incompleteDetails: ResponseData.IncompleteDetails? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -2938475829384758239L
    }
}

// ==================== 文本事件 ====================

/**
 * 文本增量事件
 * type: response.text.delta
 */
@ApiModel("文本增量事件")
@Deprecated("use ResponseOutputTextDeltaEvent")
open class ResponseTextDeltaEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("文本增量内容")
    var delta: String? = null

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 4857392013847592834L
    }
}

/**
 * 文本完成事件
 * type: response.text.done
 */
@ApiModel("文本完成事件")
@Deprecated("use ResponseOutputTextDoneEvent")
open class ResponseTextDoneEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("完整文本内容")
    var text: String? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -1029384756293847562L
    }
}

// ==================== 内容部分事件 ====================

/**
 * 内容部分添加事件
 * type: response.content_part.added
 */
@ApiModel("内容部分添加事件")
open class ResponseContentPartAddedEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("内容部分")
    var part: ResponseData.OutputItem.ContentPart? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 3847592837459234857L
    }
}

/**
 * 内容部分完成事件
 * type: response.content_part.done
 */
@ApiModel("内容部分完成事件")
open class ResponseContentPartDoneEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("内容部分")
    var part: ResponseData.OutputItem.ContentPart? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -5847293847583927485L
    }
}

// ==================== 输出项事件 ====================

/**
 * 输出项添加事件
 * type: response.output_item.added
 */
@ApiModel("输出项添加事件")
open class ResponseOutputItemAddedEvent : ResponseStreamEvent() {

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("输出项")
    var item: ResponseData.OutputItem? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 1029384756293847561L
    }
}

/**
 * 输出项完成事件
 * type: response.output_item.done
 */
@ApiModel("输出项完成事件")
open class ResponseOutputItemDoneEvent : ResponseStreamEvent() {

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("输出项")
    var item: ResponseData.OutputItem? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -3847591029384756283L
    }
}

// ==================== 进行中事件 ====================

/**
 * 响应进行中事件
 * type: response.in_progress
 */
@ApiModel("响应进行中事件")
open class ResponseInProgressEvent : ResponseStreamEvent() {

    @ApiModelProperty("响应对象")
    var response: ResponseData? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 2938475829384756239L
    }
}

// ==================== 输出文本事件 ====================

/**
 * 输出文本增量事件
 * type: response.output_text.delta
 */
@ApiModel("输出文本增量事件")
open class ResponseOutputTextDeltaEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("文本增量内容")
    var delta: String? = null

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -1029384756923847562L
    }
}

/**
 * 输出文本完成事件
 * type: response.output_text.done
 */
@ApiModel("输出文本完成事件")
open class ResponseOutputTextDoneEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("完整文本内容")
    var text: String? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 4857391029384756283L
    }
}

/**
 * 推理摘要事件
 * type: response.reasoning_summary_part.added
 */
@ApiModel("推理摘要事件")
open class ResponseReasoningSummaryEvent : ResponseStreamEvent() {

    @ApiModelProperty("摘要")
    var summary: List<ReasoningSummary>? = null

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -7583928475829384759L
    }

    /**
     * 推理摘要
     */
    @ApiModel("推理摘要")
    open class ReasoningSummary : Serializable {

        @ApiModelProperty("摘要类型")
        var type: String? = null

        @ApiModelProperty("摘要文本")
        var text: String? = null

        companion object {
            private const val serialVersionUID: Long = 3847592019384756203L
        }
    }
}

/**
 * 推理文本增量事件
 * type: response.reasoning_text.delta
 */
@ApiModel("推理文本增量事件")
open class ResponseReasoningTextDeltaEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("文本增量内容")
    var delta: String? = null

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -2938475829384756238L
    }
}

/**
 * 推理文本完成事件
 * type: response.reasoning_text.done
 */
@ApiModel("推理文本完成事件")
open class ResponseReasoningTextDoneEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("完整推理文本")
    var text: String? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 5847293847583927485L
    }
}

/**
 * 推理摘要文本增量事件
 * type: response.reasoning_summary_text.delta
 */
@ApiModel("推理摘要文本增量事件")
open class ResponseReasoningSummaryTextDeltaEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("文本增量内容")
    var delta: String? = null

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = -3948575923847562938L
    }
}

/**
 * 推理摘要文本完成事件
 * type: response.reasoning_summary_text.done
 */
@ApiModel("推理摘要文本完成事件")
open class ResponseReasoningSummaryTextDoneEvent : ResponseStreamEvent() {

    @ApiModelProperty("内容索引")
    @JSONField(name = "content_index")
    var contentIndex: Int = 0

    @ApiModelProperty("Item ID")
    @JSONField(name = "item_id")
    var itemId: String? = null

    @ApiModelProperty("输出索引")
    @JSONField(name = "output_index")
    var outputIndex: Int = 0

    @ApiModelProperty("完整摘要文本")
    var text: String? = null

    @ApiModelProperty("序列号")
    var sequenceNumber: Int = 0

    companion object {
        private const val serialVersionUID: Long = 1029384756923847562L
    }
}
