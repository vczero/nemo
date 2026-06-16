package com.ywllab.nemo.service.mcp.tools

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.transport.dto.request.CallToolRequest
import com.ywllab.nemo.transport.dto.result.CallToolResult
import com.ywllab.nemo.transport.dto.result.Content
import com.ywllab.nemo.transport.dto.tool.InputSchema
import com.ywllab.nemo.transport.dto.tool.OutputSchema
import com.ywllab.nemo.transport.dto.tool.Schema
import com.ywllab.nemo.transport.dto.tool.Tool
import com.ywllab.nemo.dto.chart.ChartPageRequest
import com.ywllab.nemo.service.ChartService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class ListChartsTool @Autowired constructor(
    private val chartService: ChartService
) {
    private val log = LoggerFactory.getLogger(ListChartsTool::class.java)

    fun getToolDefinition(): Tool {
        return Tool().apply {
            name = "list_charts"
            description = "分页查询用户的图表列表"
            inputSchema = InputSchema().apply {
                type = "object"
                properties = mapOf(
                    "page_num" to Schema().apply {
                        type = "integer"
                        description = "页码（默认1）"
                        default = 1
                    },
                    "page_size" to Schema().apply {
                        type = "integer"
                        description = "每页数量（默认10，最大100）"
                        default = 10
                    },
                    "keyword" to Schema().apply {
                        type = "string"
                        description = "搜索关键词，用于匹配图表名称（可选）"
                    }
                )
            }
            outputSchema = OutputSchema().apply {
                type = "object"
                properties = mapOf(
                    "charts" to Schema().apply {
                        type = "array"
                        description = "图表列表"
                        items = Schema().apply {
                            type = "object"
                            properties = mapOf(
                                "chart_id" to Schema().apply {
                                    type = "string"
                                    description = "图表ID"
                                },
                                "chart_name" to Schema().apply {
                                    type = "string"
                                    description = "图表名称"
                                },
                                "thumbnail_url" to Schema().apply {
                                    type = "string"
                                    description = "缩略图URL"
                                },
                                "purpose" to Schema().apply {
                                    type = "string"
                                    description = "图表用途"
                                },
                                "create_time" to Schema().apply {
                                    type = "integer"
                                    description = "创建时间戳"
                                },
                                "update_time" to Schema().apply {
                                    type = "integer"
                                    description = "更新时间戳"
                                }
                            )
                        }
                    },
                    "total" to Schema().apply {
                        type = "integer"
                        description = "总记录数"
                    },
                    "page_num" to Schema().apply {
                        type = "integer"
                        description = "当前页码"
                    },
                    "page_size" to Schema().apply {
                        type = "integer"
                        description = "每页数量"
                    }
                )
            }
        }
    }

    fun handle(request: CallToolRequest): CallToolResult {
        return try {
            val args = request.params.arguments
            val pageNum = (args["page_num"] as? Number)?.toInt() ?: 1
            val pageSize = (args["page_size"] as? Number)?.toInt() ?: 10
            val keyword = args["keyword"] as? String

            val queryRequest = ChartPageRequest().apply {
                this.pageNum = pageNum.toLong()
                this.pageSize = pageSize.toLong()
                this.keyword = keyword ?: ""
            }

            val pageResult = chartService.page(queryRequest)

            val charts = pageResult.list.map { chart ->
                mapOf(
                    "chart_id" to chart.chartId,
                    "chart_name" to chart.chartName,
                    "thumbnail_url" to (chart.thumbnailUrl ?: ""),
                    "purpose" to (chart.purpose ?: ""),
                    "create_time" to chart.createTime,
                    "update_time" to chart.updateTime
                )
            }

            val res = mapOf(
                "charts" to charts,
                "total" to pageResult.total,
                "page_num" to pageNum,
                "page_size" to pageSize
            )

            CallToolResult().apply {
                content = listOf(Content.text(JSONUtil.toJsonStr(res)))
                structuredContent = res
            }
        } catch (e: Exception) {
            log.error("list_charts error", e)
            return CallToolResult.error(e.message ?: "查询图表列表失败")
        }
    }
}
