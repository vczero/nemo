package com.ywllab.nemo.util

import com.ywllab.nemo.dto.SseEvent
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.ErrorCode
import com.ywllab.nemo.service.UserSessionHelper
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder
import java.util.concurrent.Executors

object SseUtil {
    private val log = LoggerFactory.getLogger(javaClass)

    fun createLlmSseEmitter(action: (SseEmitter) -> Unit): SseEmitter {
        val sseEmitter = SseEmitter(1000 * 60 * 20)
        try {
            UserSessionHelper.getUsername()
        } catch (e: BizException) {
            if (e.code == ErrorCode.ILLEGAL_ACCESS) {
                sseEmitter.send(SseEvent.error(ErrorCode.ILLEGAL_ACCESS))
                sseEmitter.complete()
            }
        }
        val requestAttributes = RequestContextHolder.currentRequestAttributes()
        val executor = Executors.newSingleThreadExecutor()
        executor.submit {
            RequestContextHolder.setRequestAttributes(requestAttributes)
            try {
                action(sseEmitter)
            } catch (e: Exception) {
                log.error("completion error", e)
                sseEmitter.send(SseEvent.error(ErrorCode.UNKNOWN, e.message))
                sseEmitter.complete()
            }
        }
        executor.shutdown()
        sseEmitter.onTimeout {
            log.info("sseEmitter timeout")
            sseEmitter.complete()
        }
        return sseEmitter
    }

    fun send(sseEmitter: SseEmitter, event: SseEventBuilder) {
        try {
            sseEmitter.send(event)
        } catch (e: Exception) {
            // ignore
        }
    }

    fun send(sseEmitter: SseEmitter, data: String) {
        try {
            sseEmitter.send(data, MediaType.APPLICATION_JSON)
        } catch (e: Exception) {
            // ignore
        }
    }

    fun sendDeltaReasoning(sseEmitter: SseEmitter, messageId: String, sequenceNumber: Int, content: String) {
        send(sseEmitter, SseEvent.deltaReasoningText(messageId, sequenceNumber, content))
    }

    fun sendDeltaText(sseEmitter: SseEmitter, messageId: String, sequenceNumber: Int, content: String) {
        send(sseEmitter, SseEvent.deltaText(messageId, sequenceNumber, content))
    }

    fun sendDone(sseEmitter: SseEmitter, messageId: String, sequenceNumber: Int) {
        send(sseEmitter, SseEvent.done(messageId, sequenceNumber))
    }

    fun sendError(
        sseEmitter: SseEmitter,
        messageId: String,
        errorCode: ErrorCode,
        message: String
    ) {
        send(sseEmitter, SseEvent.error(messageId, errorCode, message))
    }

    fun sendError(sseEmitter: SseEmitter, data: Any) {
        sseEmitter.send(SseEmitter.event().data(data, MediaType.APPLICATION_JSON))
    }
}
