package com.ywllab.nemo.service.mcp.tools

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.transport.dto.request.CallToolRequest
import com.ywllab.nemo.transport.dto.result.CallToolResult
import com.ywllab.nemo.transport.dto.result.Content
import com.ywllab.nemo.transport.dto.tool.InputSchema
import com.ywllab.nemo.transport.dto.tool.OutputSchema
import com.ywllab.nemo.transport.dto.tool.Schema
import com.ywllab.nemo.transport.dto.tool.Tool
import com.ywllab.nemo.dto.chart.ChartCreateRequest
import com.ywllab.nemo.service.ChartService
import com.ywllab.nemo.service.OssService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class CreateChartTool @Autowired constructor(
    private val chartService: ChartService,
    private val ossService: OssService
) {
    private val log = LoggerFactory.getLogger(CreateChartTool::class.java)

    fun getToolDefinition(): Tool {
        return Tool().apply {
            name = "create_chart"
            description = "创建新图表，需要提供图表名称和图表配置"
            inputSchema = InputSchema().apply {
                type = "object"
                properties = mapOf(
                    "chart_name" to Schema().apply {
                        type = "string"
                        description = "图表名称"
                    },
                    "chart_config" to Schema().apply {
                        type = "object"
                        description = "图表配置JSON对象"
                    },
                    "file_id" to Schema().apply {
                        type = "string"
                        description = "关联的数据文件ID"
                    },
                    "thumbnail" to Schema().apply {
                        type = "string"
                        description = "缩略图OSS路径"
                    }
                )
                required = listOf("chart_name", "file_id", "chart_config")
            }
            outputSchema = OutputSchema().apply {
                type = "object"
                properties = mapOf(
                    "chart_id" to Schema().apply {
                        type = "string"
                        description = "创建的图表ID"
                    },
                    "thumbnail_url" to Schema().apply {
                        type = "string"
                        description = "缩略图带签名URL"
                    }
                )
            }
        }
    }

    fun handle(request: CallToolRequest): CallToolResult {
        return try {
            val args = request.params.arguments
            val chartName =
                args["chart_name"] as? String ?: return CallToolResult.error("chart_name is required")

            @Suppress("UNCHECKED_CAST")
            val chartConfig =
                args["chart_config"] as? Map<String, Any>
                    ?: return CallToolResult.error("chart_config is required")
            val fileId = args["file_id"] as? String ?: return CallToolResult.error("file_id is required")
            val thumbnail = args["thumbnail"] as? String

            val createRequest = ChartCreateRequest().apply {
                this.chartName = chartName
                this.chartConfig = chartConfig
                this.fileId = fileId
            }

            val chartId = chartService.createChart(createRequest, thumbnail)
            val res = mutableMapOf<String, Any>("chart_id" to chartId)
            thumbnail?.let {
                res["thumbnail_url"] = ossService.generatePresignedUrl(it)
            }
            CallToolResult().apply {
                content = listOf(Content.text(JSONUtil.toJsonStr(res)))
                structuredContent = res
            }
        } catch (e: Exception) {
            log.error("create_chart error", e)
            return CallToolResult.error(e.message ?: "创建图表失败")
        }
    }
}
