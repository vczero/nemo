package com.ywllab.nemo.service.mcp.tools

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.transport.dto.request.CallToolRequest
import com.ywllab.nemo.transport.dto.result.CallToolResult
import com.ywllab.nemo.transport.dto.result.Content
import com.ywllab.nemo.transport.dto.tool.InputSchema
import com.ywllab.nemo.transport.dto.tool.OutputSchema
import com.ywllab.nemo.transport.dto.tool.Schema
import com.ywllab.nemo.transport.dto.tool.Tool
import com.ywllab.nemo.dto.chart.ChartUpdateRequest
import com.ywllab.nemo.service.ChartService
import com.ywllab.nemo.service.OssService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class UpdateChartTool @Autowired constructor(
    private val chartService: ChartService,
    private val ossService: OssService
) {
    private val log = LoggerFactory.getLogger(UpdateChartTool::class.java)

    fun getToolDefinition(): Tool {
        return Tool().apply {
            name = "update_chart"
            description = "更新已有图表的配置和名称"
            inputSchema = InputSchema().apply {
                type = "object"
                properties = mapOf(
                    "chart_id" to Schema().apply {
                        type = "string"
                        description = "图表ID"
                    },
                    "chart_name" to Schema().apply {
                        type = "string"
                        description = "新的图表名称"
                    },
                    "chart_config" to Schema().apply {
                        type = "object"
                        description = "新的图表配置JSON对象"
                    },
                    "thumbnail" to Schema().apply {
                        type = "string"
                        description = "缩略图OSS路径"
                    }
                )
                required = listOf("chart_id")
            }
            outputSchema = OutputSchema().apply {
                type = "object"
                properties = mapOf(
                    "chart_id" to Schema().apply {
                        type = "string"
                        description = "更新的图表ID"
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
            val chartId = args["chart_id"] as? String ?: return CallToolResult.error("chart_id is required")

            @Suppress("UNCHECKED_CAST")
            val chartConfig = args["chart_config"] as? Map<String, Any>
            val chartName = args["chart_name"] as? String
            val thumbnail = args["thumbnail"] as? String

            val updateRequest = ChartUpdateRequest().apply {
                this.chartName = chartName ?: ""
                this.chartConfig = chartConfig ?: mapOf()
            }

            chartService.updateChart(updateRequest, chartId, thumbnail)
            val res = mutableMapOf<String, Any>("chart_id" to chartId)
            thumbnail?.let {
                res["thumbnail_url"] = ossService.generatePresignedUrl(it)
            }
            CallToolResult().apply {
                content = listOf(Content.text(JSONUtil.toJsonStr(res)))
                structuredContent = res
            }
        } catch (e: Exception) {
            log.error("update_chart error", e)
            return CallToolResult.error(e.message ?: "更新图表失败")
        }
    }
}
