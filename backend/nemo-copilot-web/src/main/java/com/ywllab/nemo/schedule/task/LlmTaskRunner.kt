package com.ywllab.nemo.schedule.task

import cn.hutool.core.util.IdUtil
import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSON
import com.ywllab.nemo.constant.BatchStatus
import com.ywllab.nemo.constant.ChartType
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.dao.ComputeTaskDao
import com.ywllab.nemo.dao.ComputeTaskFileDao
import com.ywllab.nemo.dao.FileDao
import com.ywllab.nemo.dao.LlmLogDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dto.compute.llm.BatchContentResponseDto
import com.ywllab.nemo.dto.compute.llm.BatchStatusResponse
import com.ywllab.nemo.dto.compute.llm.CreateBatchRequest
import com.ywllab.nemo.dto.compute.ml.ComputeOutputFile
import com.ywllab.nemo.dto.compute.openai.ResponseParam
import com.ywllab.nemo.model.LlmLog
import com.ywllab.nemo.model.compute.ComputeEndpoint
import com.ywllab.nemo.model.compute.ComputeTask
import com.ywllab.nemo.schedule.task.llm.AbstractLlmTask
import com.ywllab.nemo.schedule.task.llm.NewsClassificationTask
import com.ywllab.nemo.schedule.task.llm.SentimentClassificationTask
import com.ywllab.nemo.schedule.task.llm.TextClassificationTask
import com.ywllab.nemo.schedule.task.llm.TextSummaryTask
import com.ywllab.nemo.service.TokenPackService
import com.ywllab.nemo.util.ChartUtil
import com.ywllab.nemo.util.LLMBatchApiUtil
import com.ywllab.nemo.util.LLMInputExcelUtil
import com.ywllab.nemo.util.LLMInputExcelUtil.LLMInputRow
import com.ywllab.nemo.util.LLMOutputExcelUtil
import com.ywllab.nemo.util.LlmResultParser
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.io.OutputStream
import java.net.SocketTimeoutException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import javax.annotation.PreDestroy

/**
 * LLM任务执行器
 * 处理LLM类型的计算任务（如情感分类、文本分类、新闻分类、文本摘要等）
 */
@Service
open class LlmTaskRunner : ComputeTaskRunner() {
    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        // todo 计算服务的系统配置，每个任务可独立配置
        private const val DIRECT_API_THRESHOLD = 500
    }

    @Autowired
    private lateinit var tokenPackService: TokenPackService

    // LLM Batch 轮询专用调度器（延迟触发下次 poll）
    private val batchPollExecutor: ScheduledExecutorService = Executors.newSingleThreadScheduledExecutor()

    // 跟踪进行中的 batch poll（taskId -> scheduled future），用于取消和清理
    private val pendingBatchPolls = ConcurrentHashMap<String, ScheduledFuture<*>>()

    @PreDestroy
    fun shutdown() {
        batchPollExecutor.shutdownNow()
    }

    /**
     * 执行LLM任务（百炼OpenAI兼容API）
     * 根据输入数量自动选择：
     * - ≤500条：直接API调用（同步）
     * - >500条：Batch模式（异步）
     */
    open fun executeTask(task: ComputeTask, endpoint: ComputeEndpoint) {
        try {
            beforeExecute(task, endpoint)

            if (task.externalTaskId?.isNotBlank() == true) {
                // 后续轮询Batch状态
                pollLlmBatchResult(task, endpoint)
            } else {
                // 执行时检查输入数量，决定使用直接API还是Batch模式
                val inputRows = buildLlmInputRows(task)
                if (inputRows.isEmpty()) {
                    handleFailure(task, endpoint, "LLM任务缺少输入数据")
                    return
                }
                if (inputRows.size <= DIRECT_API_THRESHOLD) {
                    // 小批量：直接API调用
                    executeLlmDirectTask(task, endpoint, inputRows)
                } else {
                    // 大批量：Batch模式
                    createLlmBatchTask(task, endpoint, inputRows)
                    pollLlmBatchResult(task, endpoint)
                }
            }
        } catch (e: SocketTimeoutException) {
            log.error("LLM计算任务执行超时, taskId={}, msg={}", task.taskId, e.message, e)
            handleFailure(task, endpoint, "计算服务调用超时, ${e.message}")
        } catch (e: Throwable) {
            log.error("LLM计算任务执行异常, taskId={}, msg={}", task.taskId, e.message, e)
            handleFailure(task, endpoint, "计算任务执行异常: ${e.message}")
        }
    }

    /**
     * 直接API调用（同步），用于小批量数据（≤500条）
     * 批量处理所有输入，只调用一次API
     */
    private fun executeLlmDirectTask(
        task: ComputeTask,
        endpoint: ComputeEndpoint,
        llmInputRows: List<LLMInputRow>
    ) {
        val baseUrl = endpoint.endpointUrl.trimEnd('/')
        val headerMap = buildHeaderMap(endpoint)
        val llmTask = buildLlmTask(task, endpoint.llmServiceConfig)
        log.info("LLM直接API调用, taskId={}, items={}", task.taskId, llmInputRows.size)

        try {
            // 构建批量请求：将所有输入合并为jsonlines格式
            val messages = llmTask.buildMessages(llmInputRows)

            val systemPrompt = messages.filter { it.role == "system" }.joinToString("\n") { it.content ?: "" }
            val userPrompt = messages.filter { it.role == "user" }.joinToString("\n") { it.content ?: "" }

            val responseParam = ResponseParam().apply {
                model = llmTask.getModel()
                instructions = systemPrompt.ifBlank { null }
                input = userPrompt
                stream = false
                temperature = llmTask.getTemperature()
                maxOutputTokens = llmTask.getMaxTokens()
            }
            // 记录请求参数
            ensureLlmLog(task, baseUrl, llmTask, JSONUtil.toJsonStr(responseParam))

            val responseData = ChartUtil.responseCompletion(
                baseUrl = baseUrl,
                param = responseParam,
                headerMap = headerMap,
                timeoutMs = endpoint.timeoutMs
            )

            // 解析批量响应结果
            val outputLines = LlmResultParser.parseDirectResponse(task.taskId, llmInputRows, responseData, llmTask)
            if (outputLines.isEmpty()) {
                handleFailure(task, endpoint, "LLM直接API调用结果为空: ${JSONUtil.toJsonStr(responseData)}")
                return
            }

            // 处理结果
            processLlmResult(
                task,
                outputLines,
                emptySet(),
                endpoint.llmServiceConfig
            )
        } catch (e: Exception) {
            log.error("LLM直接API调用失败, taskId={}, msg={}", task.taskId, e.message, e)
            handleFailure(task, endpoint, "LLM直接API调用失败: ${e.message}")
        }
    }

    private fun ensureLlmLog(
        task: ComputeTask,
        baseUrl: String,
        llmTask: AbstractLlmTask,
        inputJson: String
    ) {
        // 获取或创建LLM日志（避免重试时创建重复日志）
        var currentLlmLog = LlmLogDao.getByBizTypeAndBizId(task.endpointType, task.taskId)
        if (currentLlmLog == null) {
            val account = UserAccountDao.getByUserId(task.userId)
            currentLlmLog = LlmLog().apply {
                logId = IdUtil.getSnowflakeNextIdStr()
                bizType = task.endpointType
                bizId = task.taskId
                userId = task.userId
                this.accountId = account?.accountId ?: ""
                url = baseUrl
                model = llmTask.getModel()
                inputContent = inputJson
                createBy = task.userId
            }
            LlmLogDao.create(currentLlmLog)
        }
    }

    /**
     * 步骤1&2：上传输入文件到OSS并创建Batch任务
     */
    private fun createLlmBatchTask(task: ComputeTask, endpoint: ComputeEndpoint, inputRows: List<LLMInputRow>) {
        val baseUrl = endpoint.endpointUrl.trimEnd('/')
        val headerMap = buildHeaderMap(endpoint)
        val llmTask = buildLlmTask(task, endpoint.llmServiceConfig)

        // 转换为BatchJsonLine格式
        val inputItems = inputRows.map { llmTask.buildJsonLine(it) }

        val jsonlContent = inputItems.joinToString("\n") { JSONUtil.toJsonStr(it) }
        val jsonlBytes = jsonlContent.toByteArray(Charsets.UTF_8)

        // 上传JSONL文件到OSS
        val (ossPath, _) = ossService.uploadBytes(FileType.LLM_INPUT_CACHE, jsonlBytes, "input.jsonl", task.userId)
        val ossFileUrl = ossService.generatePresignedUrl(ossPath, timeout = 24, TimeUnit.HOURS)
        log.info("已生成LLM输入缓存, taskId={}, path={}", task.taskId, ossPath)

        // 步骤2：创建Batch任务: 支持id或者url
        val batchRequest = CreateBatchRequest().apply {
            input_file_id = ossFileUrl
            completion_window = "24h"
            metadata = CreateBatchRequest.BatchMetadata().apply {
                ds_name = "${task.endpointType}_${task.taskId}"
                ds_description = task.taskName
            }
        }

        // 获取或创建LLM日志（避免重试时创建重复日志）
        var currentLlmLog = LlmLogDao.getByBizTypeAndBizId(task.endpointType, task.taskId)
        ensureLlmLog(task, baseUrl, llmTask, JSONUtil.toJsonStr(batchRequest))

        if (currentLlmLog == null) {
            val account = UserAccountDao.getByUserId(task.userId)
            currentLlmLog = LlmLog().apply {
                logId = IdUtil.getSnowflakeNextIdStr()
                bizType = task.endpointType
                bizId = task.taskId
                userId = task.userId
                this.accountId = account?.accountId ?: ""
                url = baseUrl
                model = llmTask.getModel()
                inputContent = JSONUtil.toJsonStr(batchRequest)
                createBy = task.userId
            }
            LlmLogDao.create(currentLlmLog)
        }

        val batchResponse = LLMBatchApiUtil.createBatch(baseUrl, headerMap, endpoint.timeoutMs, batchRequest)
        if (batchResponse.id == null || batchResponse.error != null) {
            handleFailure(task, endpoint, "LLM Batch创建失败: $batchResponse.error")
            return
        }

        // 存储batch_id到externalTaskId
        task.externalTaskId = batchResponse.id!!
        ComputeTaskDao.updateExternalTaskId(task.taskId, task.externalTaskId!!)
        log.info("LLM Batch任务已创建, taskId={}, externalTaskId={}", task.taskId, task.externalTaskId)
    }

    /**
     * 步骤3&4：轮询Batch状态，下载并处理结果
     */
    private fun pollLlmBatchResult(task: ComputeTask, endpoint: ComputeEndpoint) {
        val baseUrl = endpoint.endpointUrl.trimEnd('/')
        val batchId = task.externalTaskId!!
        val headerMap = buildHeaderMap(endpoint)

        val statusResponse = LLMBatchApiUtil.queryBatchStatus(baseUrl, headerMap, endpoint.timeoutMs, batchId)
        if (statusResponse.error != null) {
            handleFailure(task, endpoint, "LLM Batch状态查询失败: $statusResponse.error")
            return
        }

        when (statusResponse.status) {
            BatchStatus.COMPLETED -> {
                pendingBatchPolls.remove(task.taskId)?.cancel(false)
                val outputFileId = statusResponse.output_file_id
                if (outputFileId.isNullOrBlank()) {
                    handleFailure(task, endpoint, "LLM Batch完成但无输出文件")
                    return
                }
                processLlmBatchResult(task, endpoint, statusResponse)
            }

            BatchStatus.FAILED -> {
                pendingBatchPolls.remove(task.taskId)?.cancel(false)
                handleFailure(task, endpoint, "LLM Batch执行失败: ${statusResponse.error}")
            }

            // 任务进行中，延迟后再继续 poll
            BatchStatus.IN_PROGRESS, BatchStatus.VALIDATING -> {
                val baseDelay = 60_000L // 60s
                val offset = (task.taskId.hashCode().toLong() and 0xFFFF) % baseDelay
                val delay = baseDelay + offset
                // 取消之前的延迟 poll（如果有）
                pendingBatchPolls.remove(task.taskId)?.cancel(false)

                val future = batchPollExecutor.schedule(
                    {
                        try {
                            executeTask(task, endpoint)
                        } catch (e: Exception) {
                            log.error("LLM Batch 延迟 poll 异常, taskId={}", task.taskId, e)
                        }
                    },
                    delay, TimeUnit.MILLISECONDS
                )
                pendingBatchPolls[task.taskId] = future
                log.info(
                    "LLM Batch进行中, taskId={}, batchId={}, status={}, delay={}ms",
                    task.taskId, batchId, statusResponse.status, delay
                )
                log.info("pendingBatchPolls, taskSize=${pendingBatchPolls.size}")
            }

            BatchStatus.CANCELLED -> {
                pendingBatchPolls.remove(task.taskId)?.cancel(false)
                handleFailure(task, endpoint, "LLM Batch已取消")
            }

            else -> log.warn("LLM Batch未知状态, taskId=${task.taskId}, batchId=$batchId, status=${statusResponse.status}")
        }
    }

    /**
     * 构建LLM输入行（从xlsx文件获取）
     * @return LLMInputRow列表
     */
    private fun buildLlmInputRows(task: ComputeTask): List<LLMInputRow> {
        val items = mutableListOf<LLMInputRow>()

        // 获取输入文件内容
        val inputFiles = ComputeTaskFileDao.getByTaskId(task.taskId).filter { it.fileType == FileType.COMPUTE_INPUT }
        for (taskFile in inputFiles) {
            val file = FileDao.getById(taskFile.fileId) ?: continue
            val fileContent = ossService.downloadFile(file.ossPath) ?: continue
            // 解析Excel文件
            val excelRows = try {
                LLMInputExcelUtil.parseExcel(fileContent.inputStream())
            } catch (e: Exception) {
                log.warn("Excel文件解析失败, fileId={}, msg={}", file.fileId, e.message)
                continue
            }

            items.addAll(excelRows)
        }

        return items
    }

    /**
     * 创建LLM任务实例
     */
    private fun buildLlmTask(task: ComputeTask, endpointConfig: Map<String, Any>?): AbstractLlmTask {
        return when (task.endpointType) {
            ComputeType.SENTIMENT_CLASSIFICATION -> SentimentClassificationTask(task, task.taskParams, endpointConfig)
            ComputeType.TEXT_CLASSIFICATION -> TextClassificationTask(task, task.taskParams, endpointConfig)
            ComputeType.NEWS_CLASSIFICATION -> NewsClassificationTask(task, task.taskParams, endpointConfig)
            ComputeType.TEXT_SUMMARY -> TextSummaryTask(task, task.taskParams, endpointConfig)
            else -> throw IllegalArgumentException("不支持的LLM任务类型: ${task.endpointType}")
        }
    }

    /**
     * 步骤4：下载并处理Batch结果
     */
    private fun processLlmBatchResult(
        task: ComputeTask,
        endpoint: ComputeEndpoint,
        statusResponse: BatchStatusResponse
    ) {
        val baseUrl = endpoint.endpointUrl.trimEnd('/')
        val headerMap = buildHeaderMap(endpoint)
        val outputFileId = statusResponse.output_file_id!!
        val errorFileId = statusResponse.error_file_id

        // 下载结果文件内容
        val resultContent = LLMBatchApiUtil.downloadResultFile(baseUrl, headerMap, endpoint.timeoutMs, outputFileId)
        if (resultContent == null) {
            handleFailure(task, endpoint, "LLM结果文件下载失败")
            return
        }

        // 解析结果文件
        val outputLines = LlmResultParser.parseBatchResultContent(resultContent)

        // 从error_file_id获取失败的custom_id列表
        val errorCustomIds = if (!errorFileId.isNullOrBlank()) {
            val errorContent = LLMBatchApiUtil.downloadResultFile(baseUrl, headerMap, endpoint.timeoutMs, errorFileId)
            LlmResultParser.extractErrorCustomIds(errorContent)
        } else {
            emptySet()
        }

        if (outputLines.isEmpty() && errorCustomIds.isEmpty()) {
            handleFailure(task, endpoint, "LLM结果为空")
            return
        }

        // 处理结果
        processLlmResult(
            task, outputLines, errorCustomIds, endpoint.llmServiceConfig
        )
    }

    /**
     * 处理LLM结果（通用逻辑）
     * 用于直接API调用和Batch模式的结果处理
     */
    private fun processLlmResult(
        task: ComputeTask,
        outputLines: List<BatchContentResponseDto>,
        errorCustomIds: Set<String> = emptySet(),
        endpointConfig: Map<String, Any>?
    ) {
        val now = System.currentTimeMillis()
        val llmTask = buildLlmTask(task, endpointConfig)

        // 读取原始Excel输入
        val originalExcelRows = try {
            val inputFiles =
                ComputeTaskFileDao.getByTaskId(task.taskId).filter { it.fileType == FileType.COMPUTE_INPUT }
            val inputFilePath = FileDao.getById(inputFiles.firstOrNull()!!.fileId)!!.ossPath
            val fileContent = ossService.downloadFile(inputFilePath)!!
            LLMInputExcelUtil.parseExcel(fileContent.inputStream())
        } catch (e: Exception) {
            log.warn("读取原始Excel失败, taskId={}", task.taskId, e)
            null
        }

        // 构建结果文件列表
        val resultFiles = mutableListOf<ComputeOutputFile>()

        // 解析输出结果
        val parseResult = LlmResultParser.parseOutputLines(outputLines, errorCustomIds, llmTask)

        // todo task重试时，是否要删除历史的文件关联
        // 1. all_results - 所有结果
        if (originalExcelRows != null && parseResult.labelMap.isNotEmpty()) {
            generateOutputFileWithRows(
                task, originalExcelRows, parseResult.labelMap, "all_results", LLMOutputExcelUtil::writeOutputExcel
            )?.let { resultFiles.add(it) }
        }

        // 2. fail_results - 失败结果（基于API error或解析失败）
        val failRows = originalExcelRows?.filter { row ->
            parseResult.failCustomIds.contains(row.id)
        }
        generateOutputFileWithRows(
            task, failRows, parseResult.labelMap, "fail_results", LLMOutputExcelUtil::writeOutputExcel
        )?.let { resultFiles.add(it) }

        // 3. table - 预览（前1000行）
        if (originalExcelRows != null && parseResult.labelMap.isNotEmpty()) {
            val previewRows = originalExcelRows.take(1000)
            generateOutputFileWithRows(
                task, previewRows, parseResult.labelMap, "table", LLMOutputExcelUtil::writeOutputExcel
            )?.let { resultFiles.add(it) }
        }

        // 4. 生成图表Excel（根据chartTypes生成对应Excel）
        val chartTypes = llmTask.getChartTypes()
        for (chartType in chartTypes) {
            generateChartFile(task, parseResult.labelMap, chartType)?.let { resultFiles.add(it) }
        }

        transaction {
            // 保存结果文件到数据库
            saveResultFiles(task, resultFiles)

            // 更新token统计
            val tokenCost = parseResult.totalInputTokens + parseResult.totalOutputTokens
            ComputeTaskDao.updateToken(
                task.taskId,
                parseResult.totalInputTokens,
                parseResult.totalOutputTokens,
                tokenCost.toLong()
            )

            // 更新LLM日志
            val currentLlmLog = LlmLogDao.getByBizTypeAndBizId(task.endpointType, task.taskId)
            currentLlmLog?.let { llmLog ->
                llmLog.inputTokenCount = parseResult.totalInputTokens
                llmLog.outputTokenCount = parseResult.totalOutputTokens
                llmLog.totalTokenCount = tokenCost
                llmLog.outputContent = JSONUtil.toJsonStr(outputLines)
                LlmLogDao.update(llmLog)
            }

            // token扣费
            if (tokenCost > 0) {
                val account = UserAccountDao.getByUserId(task.userId)
                if (account != null) {
                    tokenPackService.deductToken(
                        account.accountId,
                        tokenCost.toLong(),
                        task.endpointType,
                        task.taskId
                    )
                }
            }
        }
        val summary = mapOf("total_count" to parseResult.successCount)
        // 构建MlComputeResultDto
        markTaskSuccess(task, now, JSON.toJSONString(summary))
        log.info("LLM任务完成, taskId={}, successCount={}", task.taskId, parseResult.successCount)
    }

    /**
     * 生成单个结果文件（基于输入行）
     */
    private fun generateOutputFileWithRows(
        task: ComputeTask,
        inputRows: List<LLMInputRow>?,
        labelMap: Map<String, String>,
        fileName: String,
        writer: (List<LLMInputRow>, Map<String, String>, OutputStream, String) -> Unit
    ): ComputeOutputFile? {
        if (inputRows.isNullOrEmpty()) {
            return null
        }
        val outputFileName = "$fileName-${task.taskId}.xlsx"
        return try {
            val outputStream = ByteArrayOutputStream()
            writer(inputRows, labelMap, outputStream, fileName)
            val (outputPath, _) = ossService.uploadBytes(
                FileType.COMPUTE_OUTPUT,
                outputStream.toByteArray(),
                outputFileName,
                task.userId
            )
            ComputeOutputFile().apply {
                this.name = fileName
                this.path = outputPath
            }
        } catch (e: Exception) {
            log.error("生成${fileName}失败, taskId={}", task.taskId, e)
            null
        }
    }

    /**
     * 生成图表结果文件
     */
    private fun generateChartFile(task: ComputeTask, labelMap: Map<String, String>, chartType: ChartType):
        ComputeOutputFile? {
            val fileName = "chart_${chartType.value}"
            val outputFileName = "$fileName-${task.taskId}.xlsx"
            return try {
                val outputBytes = ByteArrayOutputStream()
                LLMOutputExcelUtil.writeCategoryCountExcel(labelMap, outputBytes)
                val (outputPath, _) = ossService.uploadBytes(
                    FileType.COMPUTE_OUTPUT,
                    outputBytes.toByteArray(),
                    outputFileName,
                    task.userId
                )
                ComputeOutputFile().apply {
                    this.name = fileName
                    this.path = outputPath
                }
            } catch (e: Exception) {
                log.error("生成${fileName}失败, taskId={}", task.taskId, e)
                null
            }
        }
}
