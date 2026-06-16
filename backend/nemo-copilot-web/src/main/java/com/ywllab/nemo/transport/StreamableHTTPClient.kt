package com.ywllab.nemo.transport

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.ywllab.nemo.transport.dto.request.JSONRPCRequest
import com.ywllab.nemo.transport.enum.ContentType
import com.ywllab.nemo.transport.enum.Header
import com.ywllab.nemo.transport.exception.JSONRPCException
import okhttp3.Dispatcher
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.slf4j.LoggerFactory
import java.io.EOFException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

abstract class StreamableHTTPClient(private val endpoint: String, private val headers: Map<String, String>? = null) {

    protected val log = LoggerFactory.getLogger(javaClass)!!
    protected val objectMapper = ObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .setSerializationInclusion(JsonInclude.Include.NON_NULL)!!

    protected var sessionId: String? = null

    protected fun get(accept: String): Pair<Int, Map<String, List<String>>> {
        val requestBuilder = Request.Builder().url(endpoint).header(Header.ACCEPT, accept).get()
        sessionId?.let { requestBuilder.header(Header.SESSION_ID, it) }
        headers?.forEach { (k, v) ->
            requestBuilder.header(k, v)
        }
        return okhttpClient.newCall(requestBuilder.build()).execute().use {
            it.code() to it.headers().toMultimap()
        }
    }

    protected fun post(
        request: JSONRPCRequest,
        accept: String = "${ContentType.JSON}, ${ContentType.EVENT_STREAM}"
    ): Pair<Map<String, List<String>>, String?> {
        val mediaType = MediaType.parse(ContentType.JSON)
        val requestBody = RequestBody.create(mediaType, objectMapper.writeValueAsString(request))
        val requestBuilder = Request.Builder().url(endpoint).header(Header.ACCEPT, accept).post(requestBody)
        sessionId?.let { requestBuilder.header(Header.SESSION_ID, it) }
        headers?.forEach { (k, v) ->
            requestBuilder.header(k, v)
        }
        return okhttpClient.newCall(requestBuilder.build()).execute().use { response ->
            response.headers().toMultimap() to response.body()?.use { it.string() }
        }
    }

    protected fun readEventStream(request: JSONRPCRequest?, timeout: Long): String {
        val buffer = StringBuilder()
        val latch = CountDownLatch(1)
        var exception: Throwable? = null
        val listener = object : EventSourceListener() {
            override fun onEvent(eventSource: EventSource, id: String?, event: String?, data: String) {
                buffer.append(data)
            }

            override fun onClosed(eventSource: EventSource) {
                latch.countDown()
            }

            override fun onFailure(eventSource: EventSource, throwable: Throwable?, response: Response?) {
                log.info(throwable?.message ?: response?.message() ?: "")
                if (throwable !is EOFException) {
                    exception = JSONRPCException(throwable)
                }
                latch.countDown()
            }
        }

        val accept = "${ContentType.EVENT_STREAM}, ${ContentType.JSON}"
        val requestBuilder = if (request == null) {
            Request.Builder().url(endpoint).header(Header.ACCEPT, accept).get()
        } else {
            val mediaType = MediaType.parse(ContentType.JSON)
            val requestBody = RequestBody.create(mediaType, objectMapper.writeValueAsString(request))
            Request.Builder().url(endpoint).header(Header.ACCEPT, accept).post(requestBody)
        }
        sessionId?.let { requestBuilder.header(Header.SESSION_ID, it) }
        headers?.forEach { (k, v) ->
            requestBuilder.header(k, v)
        }
        EventSources.createFactory(okhttpClient).newEventSource(requestBuilder.build(), listener)
        latch.await(timeout, TimeUnit.MILLISECONDS)
        exception?.let { throw it }
        return buffer.toString()
    }

    companion object {
        var okhttpClient: OkHttpClient = OkHttpClient.Builder()
            .dispatcher(
                Dispatcher().also {
                    it.maxRequests = 1000
                    it.maxRequestsPerHost = 100
                }
            )
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.MINUTES)
            .build()
    }
}
