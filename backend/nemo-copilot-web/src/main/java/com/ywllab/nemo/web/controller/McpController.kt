package com.ywllab.nemo.web.controller

import com.ywllab.nemo.transport.StreamableHTTPServer
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import javax.servlet.http.HttpServletRequest

@Api(tags = ["MCP服务"])
@RestController
@RequestMapping("/api/agent")
open class McpController {

    @Autowired
    lateinit var mcpServer: StreamableHTTPServer

    @RequestMapping(value = ["/mcp"], method = [RequestMethod.GET, RequestMethod.POST])
    @ApiOperation("MCP服务")
    open fun handleMcpRequest(
        @RequestHeader("Authorization") token: String,
        httpRequest: HttpServletRequest
    ): ResponseEntity<SseEmitter> {
        return mcpServer.handleRequest(httpRequest)
    }
}
