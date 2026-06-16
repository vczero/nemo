package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.alibaba.fastjson.JSON
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.constant.TaskStatus
import com.ywllab.nemo.dao.ComputeChartDao
import com.ywllab.nemo.dao.ComputeTaskDao
import com.ywllab.nemo.dao.ComputeTaskFileDao
import com.ywllab.nemo.dao.FileDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.compute.ClassificationParamsDto
import com.ywllab.nemo.dto.compute.ComputeTaskDto
import com.ywllab.nemo.dto.compute.ComputeTaskPageQuery
import com.ywllab.nemo.dto.compute.ComputeTaskResultDto
import com.ywllab.nemo.dto.compute.ComputeTaskStatisticsDto
import com.ywllab.nemo.dto.compute.ComputeTaskSubmitRequest
import com.ywllab.nemo.dto.compute.TaskFileDto
import com.ywllab.nemo.dto.compute.TextSummaryParamsDto
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.exception.ParamException
import com.ywllab.nemo.model.compute.ComputeChart
import com.ywllab.nemo.model.compute.ComputeTask
import com.ywllab.nemo.model.compute.ComputeTaskFile
import com.ywllab.nemo.util.LLMInputExcelUtil
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import java.util.concurrent.ExecutorService
import com.ywllab.nemo.service.ComputeEndpointService as ComputeEndpointBiz

@Service
open class ComputeTaskService {
    private val log = LoggerFactory.getLogger(javaClass)

    @Autowired
    private lateinit var chartService: ChartService

    @Autowired
    private lateinit var computeEndpointBiz: ComputeEndpointBiz

    @Autowired
    private lateinit var ossService: OssService

    @Autowired
    @Qualifier("computeExecutor")
    private lateinit var computeExecutor: ExecutorService

    open fun submitTask(request: ComputeTaskSubmitRequest): ComputeTaskDto {
        val userId = UserSessionHelper.getUserId()
        request.inputFiles.forEach { inputFile ->
            val file = FileDao.getById(inputFile.id) ?: throw NotFoundException("文件不存在: ${inputFile.id}")
            // 用户ID匹配校验（ossPath中包含userId）
            if (!file.ossPath.contains("/$userId/")) {
                throw ParamException("非法文件路径: ${file.ossPath}")
            }
            request.taskParams[inputFile.name] = inputFile.path
        }

        // LLM任务提交时校验token账户和Excel文件格式
        if (request.taskType in listOf(
                ComputeType.SENTIMENT_CLASSIFICATION,
                ComputeType.TEXT_CLASSIFICATION,
                ComputeType.NEWS_CLASSIFICATION,
                ComputeType.TEXT_SUMMARY
            )
        ) {
            validateLlmTaskToken(userId)
            validateLlmTaskParams(request)
            validateLlmInputFiles(request)
        }

        val task = ComputeTask().apply {
            taskId = IdUtil.getSnowflakeNextIdStr()
            taskName = request.taskName
            endpointId = ""
            endpointType = request.taskType
            taskParams = request.taskParams
            taskStatus = TaskStatus.PENDING
            retryCount = 0
        }

        // 创建任务和文件关联（事务）
        transaction {
            ComputeTaskDao.create(task, userId)
            request.inputFiles.forEach { inputFile ->
                val taskFile = ComputeTaskFile().apply {
                    fileId = inputFile.id
                    taskId = task.taskId
                    fileType = FileType.COMPUTE_INPUT
                    name = inputFile.name
                }
                ComputeTaskFileDao.create(taskFile, userId)
            }
        }

        log.info("提交计算任务, taskId={}, userId={}, endpointType={}", task.taskId, userId, task.endpointType)
        return toDto(task)
    }

    // Boss端使用，不校验用户权限
    open fun getTask(taskId: String): ComputeTaskDto {
        val task = ComputeTaskDao.getByTaskId(taskId) ?: throw NotFoundException("任务不存在")
        return toDto(task)
    }

    open fun listTasks(param: CommonPageQuery): PageResultDto<ComputeTaskDto> {
        val userId = UserSessionHelper.getUserId()
        val (list, total) = ComputeTaskDao.pageByUserId(param, userId)
        val dtoList = list.map {
            toDto(it)
        }
        return PageResultDto(dtoList, total, param)
    }

    open fun getTaskResult(taskId: String): ComputeTaskResultDto {
        val userId = UserSessionHelper.getUserId()
        val task = ComputeTaskDao.getByTaskId(taskId, userId) ?: throw NotFoundException("任务不存在")
        return toResultDto(task)
    }

    // Boss端
    open fun pageTasks(query: ComputeTaskPageQuery): PageResultDto<ComputeTaskDto> {
        var condition: Op<Boolean> = Op.TRUE
        if (!query.userId.isNullOrBlank()) {
            condition = condition and (ComputeTaskDao.userId eq query.userId!!)
        }
        if (query.endpointType != null) {
            condition = condition and (ComputeTaskDao.endpointType eq query.endpointType!!)
        }
        if (query.taskStatus != null) {
            condition = condition and (ComputeTaskDao.taskStatus eq query.taskStatus!!)
        }
        // 任务名称/任务ID查询：纯数字则按taskId精确查询，否则按taskName模糊查询
        val searchKey = query.taskName?.trim()
        if (!searchKey.isNullOrBlank()) {
            if (searchKey.all { it.isDigit() }) {
                // 纯数字，按taskId精确查询
                condition = condition and (ComputeTaskDao.taskId eq searchKey)
            } else {
                // 非纯数字，按taskName模糊查询
                condition = condition and (ComputeTaskDao.taskName like "%$searchKey%")
            }
        }
        val (list, total) = ComputeTaskDao.page(query) { condition }

        // 批量查询：files, users, fileDetails
        val filesMap = ComputeTaskFileDao.getByTaskIds(list.map { it.taskId })
        val usersMap = UserDao.getByIds(list.map { it.userId }.distinct()).associateBy { it.userId }
        val allFileIds = filesMap.values.flatten().map { it.fileId }.distinct()
        val fileDetailsMap = FileDao.listByIds(allFileIds).associateBy { it.fileId }

        val dtoList = list.map { task ->
            val taskFiles = filesMap[task.taskId] ?: emptyList()
            val user = usersMap[task.userId]
            val summary = task.summary?.let { JSON.parseObject(it, Map::class.java) as Map<String, Any> }
            val inputFiles = taskFiles.filter { it.fileType == FileType.COMPUTE_INPUT }.mapNotNull { tf ->
                val file = fileDetailsMap[tf.fileId] ?: return@mapNotNull null
                TaskFileDto(tf, ossService.generatePresignedUrl(file.ossPath), file.fileSize)
            }
            val outputFiles = taskFiles.filter { it.fileType == FileType.COMPUTE_OUTPUT }.mapNotNull { tf ->
                val file = fileDetailsMap[tf.fileId] ?: return@mapNotNull null
                TaskFileDto(tf, ossService.generatePresignedUrl(file.ossPath), file.fileSize)
            }
            ComputeTaskDto(task, user?.username, inputFiles, outputFiles, summary)
        }
        return PageResultDto(dtoList, total, query.pageNum, query.pageSize)
    }

    open fun retryTask(taskId: String): ComputeTaskDto {
        val task = ComputeTaskDao.getByTaskId(taskId)
            ?: throw NotFoundException("任务不存在")
        if (task.taskStatus != TaskStatus.FAILED) {
            throw BizException("仅失败状态的任务可以重试")
        }
        val operator = UserSessionHelper.getUserId()

        // 重置任务状态
        ComputeTaskDao.resetForRetry(taskId, operator, null, 0)
        log.info("重试计算任务, taskId={}", taskId)

        val updatedTask = ComputeTaskDao.getByTaskId(taskId)!!
        return toDto(updatedTask)
    }

    open fun getStatistics(): ComputeTaskStatisticsDto {
        val statusCounts = ComputeTaskDao.countByStatus()
        val total = statusCounts.values.sum()
        return ComputeTaskStatisticsDto(
            total = total,
            pending = statusCounts[TaskStatus.PENDING] ?: 0,
            running = statusCounts[TaskStatus.RUNNING] ?: 0,
            success = statusCounts[TaskStatus.SUCCESS] ?: 0,
            failed = statusCounts[TaskStatus.FAILED] ?: 0,
            cancelled = statusCounts[TaskStatus.CANCELLED] ?: 0
        )
    }

    open fun associateCharts(taskId: String, chartIds: List<String>) {
        val userId = UserSessionHelper.getUserId()
        ComputeTaskDao.getByTaskId(taskId, userId) ?: throw NotFoundException("任务不存在")
        val operator = UserSessionHelper.getUserId()
        transaction {
            chartIds.forEach { chartId ->
                val computeChart = ComputeChart().apply {
                    this.taskId = taskId
                    this.chartId = chartId
                    this.createBy = operator
                }
                ComputeChartDao.save(computeChart)
            }
        }
    }

    open fun deleteTask(taskId: String) {
        val userId = UserSessionHelper.getUserId()
        ComputeTaskDao.getByTaskId(taskId, userId) ?: throw NotFoundException("任务不存在")
        // 获取任务关联的图表，删除图表及其所有关联
        val chartIds = ComputeChartDao.getByTaskId(taskId).map { it.chartId }
        chartIds.forEach { chartId ->
            try {
                chartService.deleteChart(chartId)
            } catch (e: Exception) {
                log.warn("删除任务关联图表失败, chartId={}, taskId={}, error={}", chartId, taskId, e.message)
            }
        }

        transaction {
            // 删除任务关联的文件记录
            ComputeTaskFileDao.deleteByTaskId(taskId)
            // 删除任务关联的图表记录（已在上面通过chartService.deleteChart删除）
            ComputeChartDao.deleteByTaskId(taskId)
            // 删除任务本身
            ComputeTaskDao.deleteByTaskId(taskId)
        }
        log.info("删除计算任务, taskId={}, userId={}", taskId, userId)
    }

    open fun updateTaskName(taskId: String, taskName: String) {
        val userId = UserSessionHelper.getUserId()
        ComputeTaskDao.getByTaskId(taskId, userId) ?: throw NotFoundException("任务不存在")
        ComputeTaskDao.updateTaskName(taskId, taskName, userId)
        log.info("更新任务名称, taskId={}, taskName={}, userId={}", taskId, taskName, userId)
    }

    private fun toDto(task: ComputeTask): ComputeTaskDto {
        val files = ComputeTaskFileDao.getByTaskId(task.taskId)
        val inputFiles = files.filter { it.fileType == FileType.COMPUTE_INPUT }.mapNotNull { toTaskFileDto(it) }
        val outputFiles = files.filter { it.fileType == FileType.COMPUTE_OUTPUT }.mapNotNull { toTaskFileDto(it) }

        val user = task.userId.let { UserDao.getById(it) }
        val summary = task.summary?.let { JSON.parseObject(it, Map::class.java) as Map<String, Any> }

        return ComputeTaskDto().apply {
            this.userId = task.userId
            this.username = user?.username
            this.taskName = task.taskName
            this.taskId = task.taskId
            this.taskParams = task.taskParams
            this.taskType = task.endpointType
            this.taskStatus = task.taskStatus
            this.inputFiles = inputFiles
            this.outputFiles = outputFiles
            this.summary = summary
            this.errorMessage = task.errorMessage
            this.retryCount = task.retryCount
            this.startTime = task.startTime
            this.endTime = task.endTime
        }
    }

    private fun toResultDto(task: ComputeTask): ComputeTaskResultDto {
        val files = ComputeTaskFileDao.getByTaskId(task.taskId)
        val inputFiles = files.filter { it.fileType == FileType.COMPUTE_INPUT }.mapNotNull { toTaskFileDto(it) }
        val outputFiles = files.filter { it.fileType == FileType.COMPUTE_OUTPUT }.mapNotNull { toTaskFileDto(it) }

        // Get associated charts
        val charts = ComputeChartDao.getByTaskId(task.taskId)
        val chartDtos = charts.mapNotNull {
            chartService.getChart(it.chartId)
        }

        return ComputeTaskResultDto().apply {
            this.taskId = task.taskId
            this.taskStatus = task.taskStatus
            this.taskParams = task.taskParams
            this.inputFiles = inputFiles
            this.outputFiles = outputFiles
            this.summary = task.summary?.let { JSON.parseObject(it, Map::class.java) as Map<String, Any> }
            this.errorMessage = task.errorMessage
            this.charts = chartDtos
        }
    }

    private fun toTaskFileDto(taskFile: ComputeTaskFile): TaskFileDto? {
        val file = FileDao.getById(taskFile.fileId) ?: return null
        return TaskFileDto().apply {
            this.fileId = taskFile.fileId
            this.name = taskFile.name
            this.fileType = taskFile.fileType
            this.fileUrl = buildFileUrl(file.fileId)
            this.fileSize = file.fileSize
            this.createTime = taskFile.createTime
        }
    }

    private fun buildFileUrl(fileId: String): String? {
        val file = FileDao.getById(fileId) ?: return null
        return ossService.generatePresignedUrl(file.ossPath)
    }

    /**
     * 校验LLM任务账户余额
     */
    private fun validateLlmTaskToken(userId: String) {
        val account = UserAccountDao.getByUserId(userId)
        if (account == null || account.tokenBalance + account.subscribeTokenBalance <= 0) {
            throw BizException("账户余额不足")
        }
    }

    /**
     * 校验LLM任务参数
     * - 校验classificationType枚举值
     * - 校验categories非空（分类任务）
     * - 校验categories每个元素包含category和description字段且非空
     * - 校验摘要任务参数（maxSummaryLength, purpose）
     */
    private fun validateLlmTaskParams(request: ComputeTaskSubmitRequest) {
        val taskParams = request.taskParams

        // 分类任务校验categories
        if (request.taskType in listOf(
                ComputeType.SENTIMENT_CLASSIFICATION,
                ComputeType.TEXT_CLASSIFICATION,
                ComputeType.NEWS_CLASSIFICATION
            )
        ) {
            val paramsJson = JSON.toJSONString(taskParams)
            val taskParams = try {
                JSON.parseObject(paramsJson, ClassificationParamsDto::class.java)
            } catch (e: Exception) {
                throw BizException("分类任务参数格式错误，应为{classificationType,categories:[{category,description}]}")
            }
            if (taskParams.categories.isEmpty()) {
                throw BizException("分类任务参数categories不能为空")
            }
            if (taskParams.categories.size > 200) {
                throw BizException("分类任务参数categories最多200个")
            }
        }

        // 摘要任务校验参数
        if (request.taskType == ComputeType.TEXT_SUMMARY) {
            val paramsJson = JSON.toJSONString(taskParams)
            try {
                val params = JSON.parseObject(paramsJson, TextSummaryParamsDto::class.java)
                if (params.maxSummaryLength <= 0) {
                    throw BizException("摘要最大字数必须大于0")
                }
            } catch (e: Exception) {
                throw BizException("摘要任务参数格式错误，应为{maxSummaryLength,purpose}")
            }
        }
    }

    /**
     * 校验LLM任务的Excel输入文件格式
     * - 校验id字段唯一性
     * - 校验text字段非空
     * - 校验最大5000行限制
     */
    private fun validateLlmInputFiles(request: ComputeTaskSubmitRequest) {
        if (request.inputFiles.isEmpty()) {
            throw ParamException("缺少输入文件")
        }
        request.inputFiles.forEach { inputFile ->
            val file = FileDao.getById(inputFile.id)!!
            val fileType = file.fileType.lowercase()

            // 只校验Excel文件
            if (fileType == "xlsx" || fileType == "xls") {
                val fileContent = ossService.downloadFile(file.ossPath)
                    ?: throw BizException("文件读取失败: ${inputFile.name}")

                try {
                    LLMInputExcelUtil.parseExcel(fileContent.inputStream())
                } catch (e: BizException) {
                    throw BizException("Excel文件格式错误 [${inputFile.name}]: ${e.message}")
                }
            }
        }
    }
}
