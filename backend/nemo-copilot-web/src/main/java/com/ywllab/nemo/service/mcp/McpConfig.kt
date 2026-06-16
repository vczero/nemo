package com.ywllab.nemo.service.mcp

import com.ywllab.nemo.transport.dto.result.ServerCapabilities
import com.ywllab.nemo.transport.dto.result.ToolCapabilities
import com.ywllab.nemo.transport.StreamableHTTPServer
import com.ywllab.nemo.service.JwtService
import com.ywllab.nemo.service.UserSessionHelper
import com.ywllab.nemo.service.mcp.tools.CreateChartTool
import com.ywllab.nemo.service.mcp.tools.CreateStoryTool
import com.ywllab.nemo.service.mcp.tools.ListChartsTool
import com.ywllab.nemo.service.mcp.tools.UpdateChartTool
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import javax.servlet.http.HttpServletRequest

@Configuration
open class McpConfig {
    private val log = LoggerFactory.getLogger(McpConfig::class.java)

    @Autowired
    private lateinit var jwtService: JwtService

    @Autowired
    private lateinit var createChartTool: CreateChartTool

    @Autowired
    private lateinit var createStoryTool: CreateStoryTool

    @Autowired
    private lateinit var listChartsTool: ListChartsTool

    @Autowired
    private lateinit var updateChartTool: UpdateChartTool

    @Bean
    open fun mcpServer(): StreamableHTTPServer {
        val server = StreamableHTTPServer("nemo-mcp", "1.0.0")
        server.capabilities = ServerCapabilities().apply {
            tools = ToolCapabilities().apply {
                listChanged = true
            }
        }

        registerTools(server)
        return server
    }

    private fun registerTools(server: StreamableHTTPServer) {
        server.addTool(listChartsTool.getToolDefinition()) { httpRequest, req ->
            setContext(httpRequest)
            listChartsTool.handle(req)
        }

        server.addTool(createChartTool.getToolDefinition()) { httpRequest, req ->
            setContext(httpRequest)
            createChartTool.handle(req)
        }

        server.addTool(createStoryTool.getToolDefinition()) { httpRequest, req ->
            setContext(httpRequest)
            createStoryTool.handle(req)
        }

        server.addTool(updateChartTool.getToolDefinition()) { httpRequest, req ->
            setContext(httpRequest)
            updateChartTool.handle(req)
        }

        log.info("MCP tools registered: create_chart, parse_file, interpret_chart, create_story, list_charts, update_chart")
    }

    private fun setContext(httpRequest: HttpServletRequest) {
        val token = httpRequest.getHeader("Authorization") ?: return
        try {
            val userSession = jwtService.getUserSession(token)
            if (userSession != null) {
                UserSessionHelper.setSessionContext(userSession)
            }
        } catch (e: Exception) {
            log.warn("setContext failed: {}", e.message)
        }
    }
}
