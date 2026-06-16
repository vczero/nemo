package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.dao.ChartDao
import com.ywllab.nemo.dao.StoryChartRelDao
import com.ywllab.nemo.dao.StoryDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.story.StoryChartDetailResponse
import com.ywllab.nemo.dto.story.StoryCreateRequest
import com.ywllab.nemo.dto.story.StoryDetailResponse
import com.ywllab.nemo.dto.story.StoryPageRequest
import com.ywllab.nemo.dto.story.StoryPageResponse
import com.ywllab.nemo.dto.story.StoryUpdateRequest
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.model.Story
import com.ywllab.nemo.model.StoryChartRel
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
open class StoryService {
    private val log = LoggerFactory.getLogger(StoryService::class.java)

    @Autowired
    private lateinit var ossService: OssService

    open fun createStory(request: StoryCreateRequest): String {
        val userId = getUserId()
        val story = Story().apply {
            storyId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            title = request.title
            author = request.author
            description = request.description
            createBy = userId
            updateBy = userId
        }

        StoryDao.create(story)

        request.charts?.let { chartItems ->
            syncStoryCharts(story.storyId, chartItems.map { it.chartId to it.description }, userId)
        }

        log.info("Story created, storyId={}, userId={}", story.storyId, userId)
        return story.storyId
    }

    open fun get(storyId: String): StoryDetailResponse? {
        val userId = getUserId()
        val story = StoryDao.getByStoryId(storyId, userId) ?: return null
        val rels = StoryChartRelDao.getByStoryId(storyId)

        val chartDetails = rels.mapNotNull { rel ->
            val chart = ChartDao.getByChartId(rel.chartId, withChartConfig = false) ?: return@mapNotNull null
            StoryChartDetailResponse().apply {
                this.chartId = rel.chartId
                this.chartName = chart.chartName
                this.thumbnailUrl = chart.chartThumbnailPath?.let { ossService.generatePresignedUrl(it) }
                this.description = rel.description
                this.sortOrder = rel.sortOrder
            }
        }

        return StoryDetailResponse().apply {
            this.storyId = story.storyId
            title = story.title
            author = story.author
            description = story.description
            createTime = story.createTime
            updateTime = story.updateTime
            charts = chartDetails
        }
    }

    open fun updateStory(storyId: String, request: StoryUpdateRequest) {
        val userId = getUserId()
        val story = StoryDao.getByStoryId(storyId, userId) ?: throw NotFoundException("$storyId 不存在")
        story.apply {
            title = request.title
            author = request.author
            description = request.description
            updateBy = userId
        }

        StoryDao.update(story)

        request.charts?.let { chartItems ->
            syncStoryCharts(storyId, chartItems.map { it.chartId to it.description }, userId)
        }

        log.info("Story updated, storyId={}, userId={}", storyId, userId)
    }

    open fun deleteStory(storyId: String) {
        val userId = getUserId()
        StoryDao.getByStoryId(storyId, userId) ?: throw NotFoundException("$storyId 不存在")
        StoryChartRelDao.deleteByStoryId(storyId)
        StoryDao.deleteByStoryId(storyId)
        log.info("Story deleted, storyId={}, userId={}", storyId, userId)
    }

    open fun page(request: StoryPageRequest): PageResultDto<StoryPageResponse> {
        val userId = getUserId()
        val (stories, total) = StoryDao.pageByUserId(
            userId = userId,
            pageNum = request.pageNum,
            pageSize = request.pageSize
        )

        val responses = stories.map { story ->
            StoryPageResponse().apply {
                storyId = story.storyId
                title = story.title
                author = story.author
                description = story.description
                createTime = story.createTime
                updateTime = story.updateTime
            }
        }
        return PageResultDto(responses, total, request.pageNum.toLong(), request.pageSize.toLong())
    }

    private fun syncStoryCharts(storyId: String, chartItems: List<Pair<String, String?>>, userId: String) {
        val requestChartIds = chartItems.map { it.first }.toSet()
        val existingRels = StoryChartRelDao.getByStoryId(storyId)
        val existingChartIds = existingRels.map { it.chartId }.toSet()

        val toAdd = requestChartIds - existingChartIds
        val toRemove = existingChartIds - requestChartIds

        transaction {
            // Remove charts no longer in the list
            toRemove.forEach { chartId ->
                StoryChartRelDao.deleteByStoryIdAndChartId(storyId, chartId)
            }

            // Add new charts with initial sortOrder (will be corrected below after all adds)
            toAdd.forEach { chartId ->
                ChartDao.getByChartId(chartId, withChartConfig = false) ?: throw NotFoundException("$chartId 不存在")
                val description = chartItems.find { it.first == chartId }?.second
                val rel = StoryChartRel().apply {
                    this.storyId = storyId
                    this.chartId = chartId
                    this.description = description
                    this.sortOrder = -1 // placeholder, will be set below
                    createBy = userId
                    updateBy = userId
                }
                StoryChartRelDao.create(rel)
            }

            // Refresh sortOrder and description for all charts in the request list
            chartItems.forEachIndexed { index, (chartId, description) ->
                val rel = StoryChartRelDao.getByStoryIdAndChartId(storyId, chartId)!!
                rel.apply {
                    sortOrder = index
                    this.description = description
                    updateBy = userId
                    updateTime = System.currentTimeMillis()
                }
                StoryChartRelDao.update(rel)
            }
        }

        log.info("Story charts synced, storyId={}, added={}, removed={}", storyId, toAdd.size, toRemove.size)
    }
}
