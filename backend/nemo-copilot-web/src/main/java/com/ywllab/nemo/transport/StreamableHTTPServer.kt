package com.ywllab.nemo.transport

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.ywllab.nemo.transport.dto.request.CallToolRequest
import com.ywllab.nemo.transport.dto.request.JSONRPCRequest
import com.ywllab.nemo.transport.dto.result.CallToolResult
import com.ywllab.nemo.transport.dto.result.Implementation
import com.ywllab.nemo.transport.dto.result.InitializeResult
import com.ywllab.nemo.transport.dto.result.JSONRPCError
import com.ywllab.nemo.transport.dto.result.JSONRPCResponse
import com.ywllab.nemo.transport.dto.result.ListPromptsResult
import com.ywllab.nemo.transport.dto.result.ListResourcesResult
import com.ywllab.nemo.transport.dto.result.ListToolsResult
import com.ywllab.nemo.transport.dto.result.Result
import com.ywllab.nemo.transport.dto.result.ServerCapabilities
import com.ywllab.nemo.transport.dto.tool.Tool
import com.ywllab.nemo.transport.enum.ErrorCode
import com.ywllab.nemo.transport.enum.Method
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import javax.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

open class StreamableHTTPServer(name: String, version: String) {

    private val log = LoggerFactory.getLogger(javaClass)
    private val threadPool = Executors.newCachedThreadPool()
    private val objectMapper = ObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .setSerializationInclusion(JsonInclude.Include.NON_NULL)!!

    private var tools = ConcurrentHashMap<String, Pair<Tool, (HttpServletRequest, CallToolRequest) -> CallToolResult>>()
    open var serverInfo = Implementation(name, version)
    open var capabilities = ServerCapabilities()

    open fun handleRequest(httpRequest: HttpServletRequest): ResponseEntity<SseEmitter> {
        val sseEmitter = SseEmitter()
        threadPool.submit {
            try {
                handleRequest(httpRequest, sseEmitter)
            } finally {
                sseEmitter.complete()
            }
        }
        return ResponseEntity.ok(sseEmitter)
    }

    private fun handleRequest(httpRequest: HttpServletRequest, sseEmitter: SseEmitter) {
        if (httpRequest.method == "POST") {
            val body = httpRequest.reader.buffered().readText()
            val request = objectMapper.readValue(body, JSONRPCRequest::class.java)
            MDC.put("trace_id", request.id)
            if (request.method != Method.PING) {
                log.info("${request.method}: $body")
            }
            when (request.method) {
                Method.PING -> {
                    val result = JSONRPCResponse<Result>().apply { this.result = Result() }
                    result.id = request.id
                    val data = objectMapper.writeValueAsString(result)
                    sendMessage(sseEmitter, request.method, data, 0)
                }

                Method.INITIALIZE -> {
                    val result = JSONRPCResponse<InitializeResult>().apply { this.result = InitializeResult() }
                    result.id = request.id
                    result.result.protocolVersion = "2025-03-26"
                    result.result.serverInfo = serverInfo
                    result.result.capabilities = capabilities
                    val data = objectMapper.writeValueAsString(result)
                    sendMessage(sseEmitter, request.method, data)
                }

                Method.NOTIFICATIONS_INITIALIZED -> {
                }

                Method.RESOURCES_LIST -> {
                    val result = JSONRPCResponse<ListResourcesResult>().apply { this.result = ListResourcesResult() }
                    result.id = request.id
                    val data = objectMapper.writeValueAsString(result)
                    sendMessage(sseEmitter, request.method, data)
                }

                Method.PROMPTS_LIST -> {
                    val result = JSONRPCResponse<ListPromptsResult>().apply { this.result = ListPromptsResult() }
                    result.id = request.id
                    val data = objectMapper.writeValueAsString(result)
                    sendMessage(sseEmitter, request.method, data)
                }

                Method.TOOLS_LIST -> {
                    val result = JSONRPCResponse<ListToolsResult>().apply { this.result = ListToolsResult() }
                    result.id = request.id
                    result.result.tools = tools.values.map { it.first }
                    val data = objectMapper.writeValueAsString(result)
                    sendMessage(sseEmitter, request.method, data)
                }

                Method.TOOLS_CALL -> {
                    val result = JSONRPCResponse<CallToolResult>()
                    result.id = request.id
                    val callToolRequest = objectMapper.readValue(body, CallToolRequest::class.java)
                    val handler = tools[callToolRequest.params.name]?.second
                    if (handler == null) {
                        result.result = CallToolResult().apply { this.isError = true }
                        result.error = JSONRPCError(ErrorCode.INVALID_PARAMS)
                    } else {
                        try {
                            val callToolResult = handler(httpRequest, callToolRequest)
                            result.result = callToolResult
                        } catch (e: Throwable) {
                            result.result = CallToolResult().apply { this.isError = true }
                            result.error = JSONRPCError(ErrorCode.INTERNAL_ERROR, e.message)
                        }
                    }
                    val data = objectMapper.writeValueAsString(result)
                    sendMessage(sseEmitter, request.method, data)
                }
            }
        }
    }

    open fun listTools(): List<Tool> {
        return tools.values.map { it.first }
    }

    open fun addTool(tool: Tool, handler: (HttpServletRequest, CallToolRequest) -> CallToolResult) {
        tools[tool.name] = Pair(tool, handler)
    }

    open fun removeTool(toolName: String) {
        tools.remove(toolName)
    }

    private fun sendMessage(sseEmitter: SseEmitter, method: String, data: String, logLength: Int = 200) {
        sseEmitter.send(SseEmitter.event().name("message").data(data))
        if (logLength > 0) log.info("$method: ${data.take(logLength)}")
    }
}
