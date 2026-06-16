package com.ywllab.nemo.dto

import com.alibaba.fastjson.JSON
import com.ywllab.nemo.constant.SseEventType
import com.ywllab.nemo.exception.ErrorCode
import org.springframework.http.MediaType
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder

/***
 * SseEmitter返回的事件对象
 */
class SseEvent {
    lateinit var type: SseEventType

    // 按type返回不同的content
    var content: String? = null

    var sequenceNumber: Int = 0

    var messageId = ""

    private fun toJsonSmeEventBuilder(): SseEventBuilder {
        return SseEmitter.event().data(this, MediaType.APPLICATION_JSON)
    }

    // type=Error时的content结构
    data class ErrorContent(
        val errorCode: ErrorCode,
        val errorMessage: String
    )

    companion object {

        fun deltaReasoningText(messageId: String, sequenceNumber: Int, content: String): SseEventBuilder {
            return SseEvent().apply {
                this.type = SseEventType.DELTA_REASONING_TEXT
                this.sequenceNumber = sequenceNumber
                this.messageId = messageId
                this.content = content
            }.toJsonSmeEventBuilder()
        }

        fun deltaText(messageId: String, sequenceNumber: Int, content: String): SseEventBuilder {
            return SseEvent().apply {
                this.type = SseEventType.DELTA_TEXT
                this.sequenceNumber = sequenceNumber
                this.messageId = messageId
                this.content = content
            }.toJsonSmeEventBuilder()
        }

        fun error(messageId: String, error: ErrorCode, msg: String?): SseEventBuilder {
            return SseEvent().apply {
                this.type = SseEventType.ERROR
                this.messageId = messageId
                this.content = JSON.toJSONString(ErrorContent(error, msg ?: error.msg))
            }.toJsonSmeEventBuilder()
        }

        fun error(error: ErrorCode, msg: String? = null): SseEventBuilder {
            return SseEvent().apply {
                this.type = SseEventType.ERROR
                this.content = JSON.toJSONString(ErrorContent(error, msg ?: error.msg))
            }.toJsonSmeEventBuilder()
        }

        fun done(messageId: String, sequenceNumber: Int): SseEventBuilder {
            return SseEvent().apply {
                this.type = SseEventType.DONE
                this.messageId = messageId
                this.sequenceNumber = sequenceNumber
            }.toJsonSmeEventBuilder()
        }
    }
}
