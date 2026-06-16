package com.ywllab.nemo.util

import cn.hutool.http.HttpRequest
import com.alibaba.fastjson.JSON
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.ywllab.nemo.dto.compute.openai.ResponseCompletedEvent
import com.ywllab.nemo.dto.compute.openai.ResponseData
import com.ywllab.nemo.dto.compute.openai.ResponseOutputTextDeltaEvent
import com.ywllab.nemo.dto.compute.openai.ResponseParam
import com.ywllab.nemo.dto.compute.openai.ResponseReasoningTextDeltaEvent
import com.ywllab.nemo.dto.compute.openai.ResponseStreamEvent
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.SystemException
import io.reactivex.BackpressureStrategy
import io.reactivex.Flowable
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.slf4j.LoggerFactory
import java.util.concurrent.atomic.AtomicLong

object ChartUtil {
    private val log = LoggerFactory.getLogger(javaClass)

    var client = HttpUtil.okhttpClient

    /**
     * 非流式API调用（同步阻塞）
     */
    fun responseCompletion(
        baseUrl: String,
        param: ResponseParam,
        headerMap: Map<String, String> = emptyMap(),
        timeoutMs: Int = 600_000
    ): ResponseData {
        val httpRequest = HttpRequest.post("$baseUrl/v1/responses")
            .headerMap(headerMap, true)
            .header("Content-Type", "application/json")
            .body(JSON.toJSONString(param))
            .timeout(timeoutMs)

        val response = httpRequest.execute()
        if (!response.isOk || response.body().isNullOrBlank()) {
            val errorMsg = "HTTP ${response.status}: ${response.body() ?: "empty response"}"
            log.error("openaiResponseApi failed: {}", errorMsg)
            throw SystemException(errorMsg)
        }

        return try {
            JSON.parseObject(response.body(), ResponseData::class.java)
        } catch (e: Exception) {
            log.error("parse ResponseData failed: ${e.message}", e)
            throw SystemException("解析响应失败: ${e.message}")
        }
    }

    fun streamResponseCompletion(
        url: String,
        param: ResponseParam,
        onNext: (ResponseStreamEvent) -> Unit,
        onError: (Throwable) -> Unit,
        onComplete: (ResponseStreamEvent) -> Unit,
        headerMap: Map<String, String> = emptyMap()
    ) {
        val start = System.currentTimeMillis()
        val firsReasoningTime = AtomicLong(-1)
        val firstTokenTime = AtomicLong(-1)
        streamResponseCompletion(url, param, headerMap)
            .doOnError { e ->
                log.info("streamResponseCompletion error: {}", e.message)
                onError(e)
            }
            .doOnNext { event ->
                when (event) {
                    // 输出文本增量事件
                    is ResponseOutputTextDeltaEvent -> {
                        if (firstTokenTime.get() < 0) {
                            firstTokenTime.set(System.currentTimeMillis())
                            log.info("开始第一个delta token, 已等待:${firstTokenTime.get() - start}ms")
                        }
                    }
                    // 输出文本增量事件
                    is ResponseReasoningTextDeltaEvent -> {
                        if (firsReasoningTime.get() < 0) {
                            firsReasoningTime.set(System.currentTimeMillis())
                            log.info("开始第一个reasoning token, 已等待:${firsReasoningTime.get() - start}ms")
                        }
                    }

                    // 响应完成事件
                    is ResponseCompletedEvent -> {
                        onComplete(event)
                    }
                }
                onNext(event)
            }
            .blockingLast(null) ?: throw BizException("大模型响应为空")
    }

    fun streamResponseCompletion(
        url: String,
        param: Any,
        headerMap: Map<String, String> = emptyMap()
    ): Flowable<ResponseStreamEvent> {
        return Flowable.create(
            { emitter ->
                val postRequest = createRequest(param, url, headerMap)
                EventSources.createFactory(client).newEventSource(
                    postRequest,
                    object : EventSourceListener() {

                        override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                            log.info("type=$type, data:$data")
                            runCatching {
                                ResponseStreamEvent.parse(data)
                            }.onSuccess { event ->
                                emitter.onNext(event)
                            }.onFailure { e ->
                                emitter.onError(e)
                                log.warn("parse ResponseStreamEvent failed: {}", e.message)
                            }
                        }

                        override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                            super.onFailure(eventSource, t, response)
                            val message = response?.body()?.string()
                                ?.takeIf { it.isNotBlank() }
                                ?: t?.message
                                ?: "unknown error"
                            emitter.onError(SystemException(message))
                        }
                    }
                )
            },
            BackpressureStrategy.BUFFER
        )
    }

    fun createRequest(param: Any, url: String, headerMap: Map<String, String> = emptyMap()): Request {
        val jsonMediaType = okhttp3.MediaType.parse("application/json; charset=utf-8")
        val mapper = ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL)
        val body = RequestBody.create(jsonMediaType, mapper.writeValueAsString(param))
        val builder = Request.Builder()
            .url(url)
        if (headerMap.isNotEmpty()) {
            headerMap.forEach { (key, value) ->
                builder.header(key, value)
            }
        }
        return builder.post(body).build()
    }
}
