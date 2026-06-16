package com.ywllab.nemo.dao

import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSONObject
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.TaskStatus
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.model.compute.ComputeTask
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object ComputeTaskDao : BaseDao<ComputeTask>("nemo_compute_task") {
    val taskId = varchar("task_id", 32)
    val taskName = varchar("task_name", 190).nullable()
    val userId = varchar("user_id", 32)
    val endpointId = varchar("endpoint_id", 32)
    val endpointType = enumerationByName<ComputeType>("endpoint_type", 32)
    val taskParams = text("task_params").nullable()
    val taskStatus = enumerationByName<TaskStatus>("task_status", 32)
    val summary = text("summary").nullable()
    val errorMessage = varchar("error_message", 1000).nullable()
    val retryCount = integer("retry_count")
    val startTime = long("start_time").nullable()
    val endTime = long("end_time").nullable()
    val externalTaskId = varchar("external_task_id", 190).nullable()
    val inputTokenCount = integer("input_token_count").nullable()
    val outputTokenCount = integer("output_token_count").nullable()
    val tokenCost = long("token_cost").nullable()
    val workerHost = varchar("worker_host", 64).nullable()

    override val primaryKey = PrimaryKey(taskId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(taskParams)).also {
            it.taskParams = if (row.getOrNull(taskParams)?.isNotBlank() == true) {
                JSONObject.parseObject(row[taskParams])
            } else {
                mapOf()
            }
        }
    }

    override fun createModel(): ComputeTask = ComputeTask()

    fun create(task: ComputeTask, userId: String) {
        val now = System.currentTimeMillis()

        transaction {
            self.insert {
                it[taskId] = task.taskId
                it[taskName] = task.taskName
                it[self.userId] = userId
                it[endpointId] = task.endpointId
                it[endpointType] = task.endpointType
                it[taskParams] = JSONUtil.toJsonStr(task.taskParams)
                it[taskStatus] = task.taskStatus
                it[summary] = task.summary
                it[errorMessage] = task.errorMessage
                it[retryCount] = task.retryCount
                it[startTime] = task.startTime
                it[endTime] = task.endTime
                it[externalTaskId] = task.externalTaskId
                it[inputTokenCount] = task.inputTokenCount
                it[outputTokenCount] = task.outputTokenCount
                it[tokenCost] = task.tokenCost
                it[workerHost] = task.workerHost
                it[createBy] = userId
                it[createTime] = now
                it[updateBy] = userId
                it[updateTime] = now
            }
        }
    }

    fun getByTaskId(taskIdParam: String): ComputeTask? {
        return transaction {
            self.select { self.taskId.eq(taskIdParam) }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByTaskId(taskIdParam: String, userId: String): ComputeTask? {
        return transaction {
            self.select { self.taskId.eq(taskIdParam).and(self.userId eq userId) }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getTaskTypes(taskIds: List<String>): Map<String, ComputeType> {
        if (taskIds.isEmpty()) return mapOf()
        return transaction {
            self.select { self.taskId inList taskIds }
                .associate { it[self.taskId] to it[self.endpointType] }
        }
    }

    /**
     * 仅更新状态（用于 CANCELLED 等简单状态切换）
     */
    fun updateStatus(taskIdParam: String, status: TaskStatus, operator: String): Boolean {
        val updated = transaction {
            self.update({ self.taskId eq taskIdParam }) {
                it[taskStatus] = status
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }

    /**
     * 标记任务执行成功
     */
    fun markSuccess(
        taskIdParam: String,
        operator: String,
        endTimeParam: Long,
        summaryParam: String?
    ): Boolean {
        val updated = transaction {
            self.update({ self.taskId eq taskIdParam }) {
                it[taskStatus] = TaskStatus.SUCCESS
                it[endTime] = endTimeParam
                it[errorMessage] = ""
                if (summaryParam != null) it[summary] = summaryParam
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }

    /**
     * 标记任务失败（最终失败，不重试）
     */
    fun markFailed(taskIdParam: String, operator: String, errorMsg: String): Boolean {
        val updated = transaction {
            self.update({ self.taskId eq taskIdParam }) {
                it[taskStatus] = TaskStatus.FAILED
                it[errorMessage] = errorMsg
                it[endTime] = System.currentTimeMillis()
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }

    /**
     * 更新外部任务ID（用于LLM Batch任务）
     */
    fun updateExternalTaskId(taskIdParam: String, externalTaskIdParam: String): Boolean {
        val updated = transaction {
            self.update({ self.taskId eq taskIdParam }) {
                it[externalTaskId] = externalTaskIdParam
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }

    /**
     * 重置任务为待处理状态（用于失败重试）
     */
    fun resetForRetry(
        taskIdParam: String,
        operator: String,
        errorMsg: String?,
        retryCountParam: Int
    ): Boolean {
        val updated = transaction {
            self.update({ self.taskId eq taskIdParam }) {
                it[taskStatus] = TaskStatus.PENDING
                if (errorMsg != null) it[errorMessage] = errorMsg
                it[retryCount] = retryCountParam
                it[startTime] = null
                it[endTime] = null
                it[externalTaskId] = null
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }

    fun claimTask(taskIdParam: String, startTimeParam: Long): Boolean {
        val updated = transaction {
            self.update({
                (self.taskId eq taskIdParam) and (self.taskStatus eq TaskStatus.PENDING)
            }) {
                it[taskStatus] = TaskStatus.RUNNING
                it[startTime] = startTimeParam
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }

    /**
     * 抢占任务并设置执行的endpointId，首次claim时记录workerHost（重试时已存在则覆盖为同一值，无变化）
     */
    fun claimTask(taskIdParam: String, endpointIdParam: String, workerHostParam: String): Boolean {
        val updated = transaction {
            self.update({
                (self.taskId eq taskIdParam) and (self.taskStatus eq TaskStatus.PENDING)
            }) {
                it[taskStatus] = TaskStatus.RUNNING
                it[endpointId] = endpointIdParam
                it[workerHost] = workerHostParam
                it[startTime] = System.currentTimeMillis()
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }

    /**
     * 查找当前节点待处理任务：未分配(NULL) 或 属于当前节点
     */
    fun nextPendingTask(currentHost: String): String? {
        return transaction {
            self.select { (taskStatus eq TaskStatus.PENDING) and (workerHost eq null or workerHost.eq(currentHost)) }
                .orderBy(createTime, SortOrder.ASC)
                .limit(1)
                .map { it[taskId] }
                .firstOrNull()
        }
    }

    fun countRunningByUserAndEndpointType(userIdParam: String, endpointTypeParam: ComputeType): Long {
        return transaction {
            self.select {
                (self.userId eq userIdParam) and (self.endpointType eq endpointTypeParam) and (
                    taskStatus eq TaskStatus.RUNNING
                    )
            }.count()
        }
    }

    /**
     * 节点重启时，将本节点 RUNNING 状态的任务重置为 PENDING
     * @return 重置的任务数量
     */
    fun resetRunningToPending(workerHostParam: String): Int {
        return transaction {
            self.update({ (taskStatus eq TaskStatus.RUNNING) and (workerHost eq workerHostParam) }) {
                it[taskStatus] = TaskStatus.PENDING
                it[startTime] = null
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun pageByUserId(pageQuery: PageQuery, userIdParam: String): Pair<List<ComputeTask>, Long> {
        return page(pageQuery) {
            self.userId eq userIdParam
        }
    }

    fun countByStatus(): Map<TaskStatus, Long> {
        return transaction {
            TaskStatus.values().associateWith { status ->
                self.select { self.taskStatus eq status }.count()
            }
        }
    }

    fun updateToken(taskId: String, totalInputTokens: Int, totalOutputTokens: Int, tokenCost: Long) {
        transaction {
            self.update({ self.taskId eq taskId }) {
                it[self.inputTokenCount] = totalInputTokens
                it[self.outputTokenCount] = totalOutputTokens
                it[self.tokenCost] = tokenCost
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun deleteByTaskId(taskIdParam: String): Int {
        return transaction {
            self.deleteWhere { self.taskId eq taskIdParam }
        }
    }

    /**
     * 更新任务名称
     */
    fun updateTaskName(taskIdParam: String, taskNameParam: String, operator: String): Boolean {
        val updated = transaction {
            self.update({ self.taskId eq taskIdParam }) {
                it[taskName] = taskNameParam
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return updated > 0
    }
}
