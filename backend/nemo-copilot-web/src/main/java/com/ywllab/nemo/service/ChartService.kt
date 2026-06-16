package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import cn.hutool.json.JSONUtil
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.dao.ChartDao
import com.ywllab.nemo.dao.ChartFileRelDao
import com.ywllab.nemo.dao.ComputeChartDao
import com.ywllab.nemo.dao.ComputeEndpointDao
import com.ywllab.nemo.dao.ComputeTaskDao
import com.ywllab.nemo.dao.FileDao
import com.ywllab.nemo.dao.LlmLogDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.chart.ChartCreateRequest
import com.ywllab.nemo.dto.chart.ChartFile
import com.ywllab.nemo.dto.chart.ChartPageRequest
import com.ywllab.nemo.dto.chart.ChartPageResponse
import com.ywllab.nemo.dto.chart.ChartResponse
import com.ywllab.nemo.dto.chart.ChartTaskInfo
import com.ywllab.nemo.dto.chart.ChartUpdateRequest
import com.ywllab.nemo.dto.compute.openai.ResponseCompletedEvent
import com.ywllab.nemo.dto.compute.openai.ResponseOutputTextDeltaEvent
import com.ywllab.nemo.dto.compute.openai.ResponseParam
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.ErrorCode
import com.ywllab.nemo.exception.ParamException
import com.ywllab.nemo.exception.SystemException
import com.ywllab.nemo.model.Chart
import com.ywllab.nemo.model.ChartFileRel
import com.ywllab.nemo.model.LlmLog
import com.ywllab.nemo.model.compute.ComputeChart
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import com.ywllab.nemo.util.ChartUtil
import com.ywllab.nemo.util.SseUtil
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@Service
open class ChartService {
    private val log = LoggerFactory.getLogger(ChartService::class.java)

    @Autowired
    private lateinit var ossService: OssService

    @Autowired
    private lateinit var tokenPackService: TokenPackService

    companion object {
        /**
         * 小文件阈值（1MB），小于此大小的文件会在查询图表时返回内容
         */
        const val SMALL_FILE_THRESHOLD = 1 * 1024 * 1024L // 1MB
    }

    /**
     * 创建图表
     */
    open fun createChart(request: ChartCreateRequest, thumbnailPath: String? = null): String {
        val userId = getUserId()
        val now = System.currentTimeMillis()

        val chart = Chart().apply {
            chartId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            chartName = request.chartName
            chartConfig = request.chartConfig
            createBy = userId
            createTime = now
            updateBy = userId
            updateTime = now
        }

        transaction {
            ChartDao.create(chart)

            // 如果传入了fileId，建立图表与文件的关联
            request.fileId?.let { fileId ->
                associateFileWithChart(chart.chartId, fileId, userId)
            }

            // 如果传入了taskId，建立图表与计算任务的关联
            request.taskId?.let { taskId ->
                val taskExistingChart = ComputeChartDao.exist(taskId, chart.chartId)
                if (!taskExistingChart) {
                    val computeChart = ComputeChart().apply {
                        this.taskId = taskId
                        this.chartId = chart.chartId
                        this.createBy = userId
                    }
                    ComputeChartDao.save(computeChart)
                    log.info("Chart associated with task, chartId={}, taskId={}", chart.chartId, taskId)
                }
            }

            // 如果传入了thumbnailPath，直接保存路径
            if (thumbnailPath != null) {
                chart.chartThumbnailPath = thumbnailPath
                ChartDao.updateThumbnailPath(chart.chartId, thumbnailPath)
                log.info("Chart thumbnail path set, chartId={}, thumbnailPath={}", chart.chartId, thumbnailPath)
            }
        }
        log.info("Chart created, chartId={}, userId={}", chart.chartId, userId)
        return chart.chartId
    }

    /**
     * 根据ID查询图表配置
     */
    open fun getChart(chartId: String, withChartFile: Boolean = true, withChartConfig: Boolean = true): ChartResponse? {
        val userId = getUserId()
        val chart = ChartDao.getByChartId(chartId, withChartConfig) ?: return null

        // 权限验证
        if (chart.userId != userId) {
            throw BizException("没有数据权限")
        }

        val chartFile = if (withChartFile) {
            // 获取关联的文件信息
            val files = ChartFileRelDao.getByChartId(chartId)
            val file = files.firstOrNull()
            if (file != null) {
                ChartFile().apply {
                    fileId = file.fileId
                    fileName = file.fileName
                    fileSize = file.fileSize
                    fileType = file.fileType
                    this.url = ossService.generatePresignedUrl(file.ossPath)
                    // 如果是小文件，从OSS内网下载内容
                    if (file.fileSize <= SMALL_FILE_THRESHOLD) {
                        content = ossService.downloadFileContent(file.ossPath, internal = true)
                    }
                }
            } else {
                null
            }
        } else {
            null
        }
        return ChartResponse().apply {
            this.chartId = chart.chartId
            this.userId = chart.userId
            chartName = chart.chartName
            chartConfig = if (withChartConfig) {
                chart.chartConfig
            } else {
                null
            }
            this.chartFile = chartFile
            thumbnailUrl = chart.chartThumbnailPath?.let { ossService.generatePresignedUrl(it) }
            interpretContent = chart.interpretContent
            interpretContentEn = chart.interpretContentEn
            this.purpose = chart.purpose
            createTime = chart.createTime
            updateTime = chart.updateTime
        }
    }

    /**
     * 更新图表配置
     */
    open fun updateChart(param: ChartUpdateRequest?, chartId: String, newThumbnail: Any?) {
        if (param == null && newThumbnail == null) {
            throw ParamException("param和thumbnail不能同时为空")
        }
        val userId = getUserId()
        val chart = ChartDao.getByChartId(chartId) ?: throw BizException("记录不存在")
        // 权限验证
        if (chart.userId != userId) {
            throw BizException("没有数据权限")
        }
        val oldThumbnail = chart.chartThumbnailPath
        transaction {
            if (newThumbnail != null) {
                val ossPath = when (newThumbnail) {
                    is String -> newThumbnail // OSS path directly
                    is MultipartFile -> {
                        // 校验文件大小（最大2MB）
                        if (newThumbnail.size > 2 * 1024 * 1024) {
                            throw ParamException("文件大小不能超过2MB")
                        }
                        // 上传到OSS
                        ossService.uploadFile(FileType.CHART_THUMBNAIL, newThumbnail, userId).first
                    }
                    else -> throw ParamException("thumbnail参数类型无效")
                }
                if (param == null) {
                    // 更新数据库
                    ChartDao.updateThumbnailPath(chartId, ossPath)
                    log.info("Chart thumbnail updated, chartId={}, ossPath={}", chartId, ossPath)
                } else {
                    chart.chartThumbnailPath = ossPath
                }
            }
            if (param != null) {
                chart.apply {
                    chartName = param.chartName
                    chartConfig = param.chartConfig
                    updateBy = userId
                    updateTime = System.currentTimeMillis()
                }
                ChartDao.update(chart)
                // 如果传入了fileId，建立图表与文件的关联
                param.fileId?.let { fileId ->
                    associateFileWithChart(chartId, fileId, userId)
                }
            }
        }
        if (newThumbnail != null && oldThumbnail != null) {
            ossService.deleteFile(oldThumbnail)
        }
        log.info("Chart updated, chartId={}, userId={}", chart.chartId, userId)
    }

    /**
     * 关联文件到图表（公共方法）
     * @param chartId 图表ID
     * @param fileId 文件ID
     * @param userId 用户ID
     */
    private fun associateFileWithChart(chartId: String, fileId: String, userId: String) {
        val file = FileDao.getById(fileId)
        if (file == null || file.userId != userId) {
            throw BizException("记录不存在")
        }

        // 删除旧的关联关系
        transaction {
            ChartFileRelDao.deleteByChartId(chartId)
            // 创建新的关联关系
            val chartFileRel = ChartFileRel().apply {
                this.chartId = chartId
                this.fileId = fileId
                createTime = System.currentTimeMillis()
                createBy = userId
            }
            ChartFileRelDao.save(chartFileRel)
        }
        log.info("Chart associated with file, chartId={}, fileId={}", chartId, fileId)
    }

    /**
     * 删除图表
     */
    open fun deleteChart(chartId: String) {
        val userId = getUserId()
        val chart = ChartDao.getByChartId(chartId)
            ?: throw BizException("记录不存在")

        // 权限验证
        if (chart.userId != userId) {
            throw BizException("没有数据权限")
        }

        val chartFiles = ChartFileRelDao.getByChartId(chartId)
        chartFiles.forEach { file ->
            // 删除OSS文件
            ossService.deleteFile(file.ossPath)
        }
        val chartFileIds = chartFiles.map { it.fileId }
        transaction {
            // 删除关联的文件
            FileDao.delete(chartFileIds)
            // 删除关联关系
            ChartFileRelDao.deleteByChartId(chartId)
            // 删除关联的计算图表
            ComputeChartDao.deleteByChartId(chartId)
            // 删除图表
            ChartDao.deleteByChartId(chartId)
        }
        log.info("Chart deleted, chartId={}, userId={}", chartId, userId)
    }

    /**
     * 分页查询用户的图表
     */
    open fun page(request: ChartPageRequest): PageResultDto<ChartPageResponse> {
        val userId = getUserId()
        val (charts, total) = ChartDao.pageByUserId(
            userId = userId,
            pageNum = request.pageNum.toInt(),
            pageSize = request.pageSize.toInt(),
            keyword = request.decodeKeyWord()
        )
        // 查询关联的计算任务ID和任务类型
        val computeTaskIdMap = ComputeChartDao.chartIdMap(charts.map { it.chartId })
        val uniqueTaskIds = computeTaskIdMap.values.distinct()
        val taskTypeMap = ComputeTaskDao.getTaskTypes(uniqueTaskIds)

        val responses = charts.map { chart ->
            ChartPageResponse().apply {
                chartId = chart.chartId
                chartName = chart.chartName
                thumbnailUrl = chart.chartThumbnailPath?.let { ossService.generatePresignedUrl(it) }
                createTime = chart.createTime
                updateTime = chart.updateTime
                purpose = chart.purpose
                val taskId = computeTaskIdMap[chart.chartId]
                if (taskId != null) {
                    task = ChartTaskInfo().apply {
                        this.taskId = taskId
                        this.taskType = taskTypeMap[taskId]!!
                    }
                }
            }
        }
        return PageResultDto(responses, total, request)
    }

    private fun getFileExtension(filename: String): String {
        val lastDot = filename.lastIndexOf('.')
        return if (lastDot > 0) filename.substring(lastDot + 1) else ""
    }

    open fun chartInterpret(chartId: String, purpose: String, sseEmitter: SseEmitter) {
        val userId = getUserId()
        val files = ChartFileRelDao.getByChartId(chartId)
        if (files.isEmpty()) {
            throw BizException("图表没有关联的数据文件")
        }
        val account = UserAccountDao.getByUserId(userId)!!
        if (account.tokenBalance + account.subscribeTokenBalance <= 0) {
            throw BizException("账户余额不足")
        }
        val endpoint = ComputeEndpointDao.getActiveByEndpointType(ComputeType.CHART_INTERPRET)
            ?: throw SystemException("系统尚未配置图表解读服务")
        val url = endpoint.endpointUrl
        val llmConfig = endpoint.llmServiceConfig ?: mapOf()
        val filePath = files.first().ossPath
        val param = ResponseParam().apply {
            model = llmConfig["model"]?.toString()
            temperature = llmConfig["temperature"]?.toString()?.toDouble()
            input = mapOf(
                "system_prompt" to llmConfig["instructions"]?.toString(),
                "user_data_oss_path" to filePath,
                "purpose" to purpose
            )
        }

        val messageId = IdUtil.getSnowflakeNextIdStr()
        val accountId = account.accountId
        val llmLog = LlmLog().apply {
            logId = IdUtil.getSnowflakeNextIdStr()
            bizType = endpoint.endpointType
            bizId = chartId
            this.userId = userId
            this.accountId = accountId
            this.url = url
            model = param.model!!
            inputContent = JSONUtil.toJsonStr(param)
            createBy = userId
        }
        LlmLogDao.create(llmLog)

        try {
            ChartUtil.streamResponseCompletion(
                url, param,
                onNext = { event ->
                    if (event is ResponseOutputTextDeltaEvent) {
                        SseUtil.sendDeltaText(sseEmitter, messageId, event.sequenceNumber, event.delta ?: "")
                    }
                },
                onError = { error ->
                    SseUtil.sendError(sseEmitter, error)
                },
                onComplete = { event ->
                    if (event is ResponseCompletedEvent) {
                        SseUtil.sendDone(sseEmitter, messageId, event.sequenceNumber)
                        sseEmitter.complete()
                        val interpretContent = event.response?.output?.firstOrNull()?.content?.firstOrNull()?.text ?: ""
                        ChartDao.updateInterpretContent(chartId, interpretContent, purpose, userId)
                        // 更新LLM日志
                        val completedLog = llmLog.also {
                            it.outputContent = JSONUtil.toJsonStr(event.response)
                            it.inputTokenCount = event.response?.usage?.inputTokens
                            it.outputTokenCount = event.response?.usage?.outputTokens
                            it.totalTokenCount = event.response?.usage?.totalTokens
                        }
                        LlmLogDao.update(completedLog)
                        // token扣费
                        val totalTokens = event.response?.usage?.totalTokens ?: 0
                        if (totalTokens > 0) {
                            tokenPackService.deductToken(
                                accountId,
                                totalTokens.toLong(),
                                ComputeType.CHART_INTERPRET,
                                chartId
                            )
                        }
                    }
                }
            )
        } catch (e: Exception) {
            if (e is BizException) {
                SseUtil.sendError(sseEmitter, messageId, e.code, e.message ?: "")
            } else {
                SseUtil.sendError(sseEmitter, messageId, ErrorCode.UNKNOWN, e.message ?: "")
            }
        } finally {
            sseEmitter.complete()
        }
    }

    open fun chartInterpretTranslate(chartId: String, sseEmitter: SseEmitter) {
        val user = getUserId()
        val files = ChartFileRelDao.getByChartId(chartId)
        if (files.isEmpty()) {
            throw BizException("图表没有关联的数据文件")
        }
        val account = UserAccountDao.getByUserId(user)
        if (account == null || account.tokenBalance + account.subscribeTokenBalance <= 0) {
            throw BizException("账户余额不足")
        }
        val accountId = account.accountId
        val endpoint = ComputeEndpointDao.getActiveByEndpointType(ComputeType.TRANSLATE_TEXT)
            ?: throw SystemException("系统尚未配置图表解读翻译服务")
        val url = endpoint.endpointUrl
        val llmConfig = endpoint.llmServiceConfig ?: mapOf()
        val chart = ChartDao.getByChartId(chartId) ?: throw BizException("图表没有关联的解读内容")
        val interpretContent = chart.interpretContent
        if (interpretContent.isNullOrBlank()) {
            throw BizException("图表没有关联的解读内容")
        }
        val param = ResponseParam().apply {
            model = llmConfig["model"]?.toString()
            temperature = llmConfig["temperature"]?.toString()?.toDouble()
            instructions = llmConfig["instructions"]?.toString()
            input = mapOf(
                "user_data_text" to interpretContent
            )
        }

        val messageId = IdUtil.getSnowflakeNextIdStr()
        val llmLog = LlmLog().apply {
            logId = messageId
            bizType = ComputeType.TRANSLATE_TEXT
            bizId = chartId
            userId = user
            this.accountId = accountId
            this.url = url
            model = param.model ?: ""
            inputContent = JSONUtil.toJsonStr(param)
            createTime = System.currentTimeMillis()
            createBy = user
        }
        LlmLogDao.create(llmLog)

        try {
            ChartUtil.streamResponseCompletion(
                url, param,
                onNext = { event ->
                    if (event is ResponseOutputTextDeltaEvent) {
                        SseUtil.sendDeltaText(sseEmitter, messageId, event.sequenceNumber, event.delta ?: "")
                    }
                },
                onError = { error ->
                    SseUtil.sendError(sseEmitter, error)
                },
                onComplete = { event ->
                    if (event is ResponseCompletedEvent) {
                        SseUtil.sendDone(sseEmitter, messageId, event.sequenceNumber)
                        sseEmitter.complete()
                        log.info("result: ${JSONUtil.toJsonStr(event.response)}")
                        val interpretContentEn =
                            event.response?.output?.firstOrNull()?.content?.firstOrNull()?.text ?: ""
                        ChartDao.updateInterpretContentEn(chartId, interpretContentEn, user)
                        // 更新LLM日志
                        val completedLog = LlmLog().apply {
                            logId = messageId
                            outputContent = interpretContentEn
                            inputTokenCount = event.response?.usage?.inputTokens
                            outputTokenCount = event.response?.usage?.outputTokens
                            totalTokenCount = event.response?.usage?.totalTokens
                        }
                        LlmLogDao.update(completedLog)
                        // token扣费
                        val totalTokens = event.response?.usage?.totalTokens ?: 0
                        if (totalTokens > 0) {
                            tokenPackService.deductToken(
                                accountId,
                                totalTokens.toLong(),
                                ComputeType.TRANSLATE_TEXT,
                                chartId
                            )
                        }
                    }
                }
            )
        } catch (e: Exception) {
            if (e is BizException) {
                SseUtil.sendError(sseEmitter, messageId, e.code, e.message ?: "")
            } else {
                SseUtil.sendError(sseEmitter, messageId, ErrorCode.UNKNOWN, e.message ?: "")
            }
        } finally {
            sseEmitter.complete()
        }
    }
}
