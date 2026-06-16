package com.ywllab.nemo.schedule.task

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.constant.NotificationPriority
import com.ywllab.nemo.dao.ComputeTaskDao
import com.ywllab.nemo.dao.ComputeTaskFileDao
import com.ywllab.nemo.dao.FileDao
import com.ywllab.nemo.dto.compute.ml.ComputeOutputFile
import com.ywllab.nemo.model.NemoFile
import com.ywllab.nemo.model.compute.ComputeEndpoint
import com.ywllab.nemo.model.compute.ComputeTask
import com.ywllab.nemo.model.compute.ComputeTaskFile
import com.ywllab.nemo.service.NotificationService
import com.ywllab.nemo.service.OssService
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

/**
 * 计算任务辅助类
 * 提供公共方法模板，子类可覆盖特定步骤
 */
@Component
abstract class ComputeTaskRunner {
    private val log = LoggerFactory.getLogger(javaClass)

    @Autowired
    lateinit var ossService: OssService

    @Autowired
    private lateinit var notificationService: NotificationService

    /**
     * 获取最大重试次数
     * 子类可覆盖
     */
    protected open fun getMaxRetry(endpoint: ComputeEndpoint): Int = endpoint.maxRetry

    /**
     * 执行任务前的检查
     * 子类可覆盖
     */
    protected open fun beforeExecute(task: ComputeTask, endpoint: ComputeEndpoint) {}

    /**
     * 处理任务结果（成功时调用）
     * 子类可覆盖
     */
    protected open fun handleSuccess(
        task: ComputeTask,
        endpoint: ComputeEndpoint,
        resultData: Any?
    ) {
        // 默认实现由子类覆盖
    }

    /**
     * 执行失败处理
     * 模板方法：处理重试或标记失败
     */
    fun handleFailure(task: ComputeTask, endpoint: ComputeEndpoint, errorMessage: String) {
        val newRetryCount = task.retryCount + 1

        if (newRetryCount < getMaxRetry(endpoint)) {
            // 重试：回退到 PENDING 状态
            ComputeTaskDao.resetForRetry(task.taskId, task.createBy, errorMessage, newRetryCount)
            log.warn(
                "计算任务执行失败，等待重试, taskId={}, retryCount={}, error={}",
                task.taskId,
                newRetryCount,
                errorMessage
            )
        } else {
            // 超过最大重试次数，标记为失败
            ComputeTaskDao.markFailed(task.taskId, task.createBy, errorMessage)
            sendFailureNotification(task, errorMessage)
            log.error("计算任务执行失败，已达最大重试次数, taskId={}, error={}", task.taskId, errorMessage)
        }
    }

    /**
     * 标记任务成功
     * 模板方法：更新状态、发送通知
     */
    protected fun markTaskSuccess(
        task: ComputeTask,
        endTime: Long,
        summaryParam: String? = null
    ) {
        ComputeTaskDao.markSuccess(
            taskIdParam = task.taskId,
            operator = task.createBy,
            endTimeParam = endTime,
            summaryParam = summaryParam
        )
        sendSuccessNotification(task)
        log.info("计算任务执行成功, taskId={}", task.taskId)
    }

    /**
     * 发送成功通知
     */
    private fun sendSuccessNotification(task: ComputeTask) {
        try {
            var name = task.endpointType.desc
            if (!task.taskName.isNullOrBlank()) {
                name = "$name-${task.taskName}"
            }
            notificationService.sendComputeNotification(
                userId = task.userId,
                title = "计算任务完成",
                content = "您的计算任务 [$name] 已完成，请前往查看结果。",
                priority = NotificationPriority.NORMAL,
                linkUrl = null,
                linkId = "${task.taskId}#${task.endpointType.name}"
            )
        } catch (e: Exception) {
            log.error("发送任务完成通知失败, taskId={}", task.taskId, e)
        }
    }

    /**
     * 发送失败通知
     */
    private fun sendFailureNotification(task: ComputeTask, errorMessage: String?) {
        try {
            var name = task.endpointType.desc
            if (!task.taskName.isNullOrBlank()) {
                name = "$name-${task.taskName}"
            }
            notificationService.sendComputeNotification(
                userId = task.userId,
                title = "计算任务失败",
                content = "您的计算任务 [$name] 执行失败：$errorMessage",
                priority = NotificationPriority.IMPORTANT,
                linkUrl = null,
                linkId = "${task.taskId}#${task.endpointType.name}"
            )
        } catch (e: Exception) {
            log.error("发送任务失败通知失败, taskId={}", task.taskId, e)
        }
    }

    /**
     * 创建结果文件记录
     */
    fun createResultFile(ossPath: String, userId: String): String? {
        return try {
            val fileName = ossPath.substringAfterLast("/")
            val extension = fileName.substringAfterLast(".")
            val fileSize = ossService.getFileSize(ossPath)

            val nemoFile = NemoFile().apply {
                fileId = IdUtil.getSnowflakeNextIdStr()
                this.userId = userId
                this.fileName = fileName
                this.ossPath = ossPath
                this.fileSize = fileSize
                this.fileType = extension
                mimeType = getMimeType(extension)
                createBy = userId
                createTime = System.currentTimeMillis()
                updateBy = userId
                updateTime = System.currentTimeMillis()
            }
            FileDao.create(nemoFile)
            nemoFile.fileId
        } catch (e: Exception) {
            log.error("创建结果文件记录失败, ossPath={}", ossPath, e)
            null
        }
    }

    /**
     * 获取MIME类型
     */
    protected fun getMimeType(extension: String): String {
        return when (extension.lowercase()) {
            "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            "xls" -> "application/vnd.ms-excel"
            "csv" -> "text/csv"
            "json" -> "application/json"
            "txt" -> "text/plain"
            "pdf" -> "application/pdf"
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            else -> "application/octet-stream"
        }
    }

    /**
     * 构建HTTP请求头Map
     */
    protected fun buildHeaderMap(endpoint: ComputeEndpoint): Map<String, String> {
        val llmConfig = endpoint.llmServiceConfig ?: emptyMap()
        val headerMap = mutableMapOf<String, String>()

        // 添加Authorization头
        val apiKey = llmConfig["api_key"]?.toString() ?: ""
        if (apiKey.isNotBlank()) {
            headerMap["Authorization"] = "Bearer $apiKey"
        }

        // 添加自定义请求头
        endpoint.headers?.forEach { (key, value) ->
            headerMap[key] = value
        }

        return headerMap
    }

    /**
     * 保存结果文件到数据库
     */
    protected fun saveResultFiles(
        task: ComputeTask,
        resultFiles: List<ComputeOutputFile>
    ) {
        if (resultFiles.isEmpty()) {
            return
        }

        transaction {
            for (fileInfo in resultFiles) {
                if (fileInfo.path.isNotBlank()) {
                    val fileId = createResultFile(fileInfo.path, task.userId)
                    if (fileId != null) {
                        val taskFile = ComputeTaskFile().apply {
                            this.fileId = fileId
                            this.taskId = task.taskId
                            this.fileType = FileType.COMPUTE_OUTPUT
                            this.name = fileInfo.name
                        }
                        ComputeTaskFileDao.create(taskFile, task.userId)
                    }
                }
            }
        }
    }
}
