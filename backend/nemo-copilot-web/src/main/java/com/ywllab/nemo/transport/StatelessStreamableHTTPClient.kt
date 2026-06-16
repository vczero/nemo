package com.ywllab.nemo.transport

import com.fasterxml.jackson.core.type.TypeReference
import com.ywllab.nemo.transport.dto.request.CallToolParams
import com.ywllab.nemo.transport.dto.request.CallToolRequest
import com.ywllab.nemo.transport.dto.request.InitializeRequest
import com.ywllab.nemo.transport.dto.request.ListToolsParams
import com.ywllab.nemo.transport.dto.request.ListToolsRequest
import com.ywllab.nemo.transport.dto.request.PingRequest
import com.ywllab.nemo.transport.dto.result.CallToolResult
import com.ywllab.nemo.transport.dto.result.JSONRPCResponse
import com.ywllab.nemo.transport.dto.result.ListToolsResult
import com.ywllab.nemo.transport.dto.result.Result
import com.ywllab.nemo.transport.enum.ContentType
import com.ywllab.nemo.transport.enum.Header

class StatelessStreamableHTTPClient(
    endpoint: String,
    headers: Map<String, String>? = null,
    private val timeout: Long = 30_000
) : StreamableHTTPClient(endpoint, headers) {

    private var acceptEventStream = false

    init {
        sessionId = post(InitializeRequest())
            .first.takeIf { it.contains(Header.SESSION_ID) }
            ?.getValue(Header.SESSION_ID)?.firstOrNull()
        acceptEventStream = get(ContentType.EVENT_STREAM).let { (status, headers) ->
            val contentType = headers.getOrDefault(Header.CONTENT_TYPE, emptyList())
            (status in 200..299) and (contentType.count { ContentType.JSON in it } < contentType.size)
        }
    }

    fun ping(): JSONRPCResponse<Result> {
        val request = PingRequest()
        val responseData = if (!acceptEventStream) {
            post(request).second!!
        } else {
            readEventStream(request, timeout)
        }
        return objectMapper.readValue(responseData, object : TypeReference<JSONRPCResponse<Result>>() {})
    }

    fun listTools(params: ListToolsParams? = null): JSONRPCResponse<ListToolsResult> {
        val request = ListToolsRequest().apply { this.params = params }
        val responseData = if (!acceptEventStream) {
            post(request).second!!
        } else {
            readEventStream(request, timeout)
        }
        return objectMapper.readValue(responseData, object : TypeReference<JSONRPCResponse<ListToolsResult>>() {})
    }

    fun callTool(params: CallToolParams): JSONRPCResponse<CallToolResult> {
        val request = CallToolRequest().apply { this.params = params }
        val responseData = if (!acceptEventStream) {
            post(request).second!!
        } else {
            readEventStream(request, timeout)
        }
        return objectMapper.readValue(responseData, object : TypeReference<JSONRPCResponse<CallToolResult>>() {})
    }
}
