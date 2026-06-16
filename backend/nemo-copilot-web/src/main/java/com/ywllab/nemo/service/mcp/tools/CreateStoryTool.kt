package com.ywllab.nemo.service.mcp.tools

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.transport.dto.request.CallToolRequest
import com.ywllab.nemo.transport.dto.result.CallToolResult
import com.ywllab.nemo.transport.dto.result.Content
import com.ywllab.nemo.transport.dto.tool.InputSchema
import com.ywllab.nemo.transport.dto.tool.OutputSchema
import com.ywllab.nemo.transport.dto.tool.Schema
import com.ywllab.nemo.transport.dto.tool.Tool
import com.ywllab.nemo.dto.story.StoryChartItem
import com.ywllab.nemo.dto.story.StoryCreateRequest
import com.ywllab.nemo.service.StoryService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class CreateStoryTool @Autowired constructor(
    private val storyService: StoryService
) {
    private val log = LoggerFactory.getLogger(CreateStoryTool::class.java)

    fun getToolDefinition(): Tool {
        return Tool().apply {
            name = "create_story"
            description = "创建数据故事，将多个图表组合成一个完整的数据故事"
            inputSchema = InputSchema().apply {
                type = "object"
                properties = mapOf(
                    "title" to Schema().apply {
                        type = "string"
                        description = "故事标题"
                    },
                    "author" to Schema().apply {
                        type = "string"
                        description = "作者"
                    },
                    "description" to Schema().apply {
                        type = "string"
                        description = "故事描述（可选）"
                    },
                    "charts" to Schema().apply {
                        type = "array"
                        description = "关联的图表列表（可选）"
                        items = Schema().apply {
                            type = "object"
                            properties = mapOf(
                                "chart_id" to Schema().apply {
                                    type = "string"
                                    description = "图表ID"
                                },
                                "description" to Schema().apply {
                                    type = "string"
                                    description = "图表在故事中的描述（可选）"
                                }
                            )
                        }
                    }
                )
                required = listOf("title", "author")
            }
            outputSchema = OutputSchema().apply {
                type = "object"
                properties = mapOf(
                    "story_id" to Schema().apply {
                        type = "string"
                        description = "创建的故事ID"
                    }
                )
            }
        }
    }

    @Suppress("UNCHECKED_CAST")
    fun handle(request: CallToolRequest): CallToolResult {
        return try {
            val args = request.params.arguments
            val title = args["title"] as? String ?: return CallToolResult.error("title is required")
            val author = args["author"] as? String ?: return CallToolResult.error("author is required")
            val storyDescription = args["description"] as? String
            val chartsParam = args["charts"] as? List<Map<String, Any>>

            val storyRequest = StoryCreateRequest().apply {
                this.title = title
                this.author = author
                this.description = storyDescription
                this.charts = chartsParam?.map { chartItem ->
                    StoryChartItem().apply {
                        this.chartId = chartItem["chart_id"] as? String ?: ""
                        this.description = chartItem["description"] as? String
                    }
                }
            }

            val storyId = storyService.createStory(storyRequest)
            val res = mapOf("story_id" to storyId)
            CallToolResult().apply {
                content = listOf(Content.text(JSONUtil.toJsonStr(res)))
                structuredContent = res
            }
        } catch (e: Exception) {
            log.error("create_story error", e)
            return CallToolResult.error(e.message ?: "创建数据故事失败")
        }
    }
}
