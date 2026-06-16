package com.ywllab.nemo.dao

import cn.hutool.core.util.IdUtil
import cn.hutool.json.JSONUtil
import com.ywllab.nemo.model.AgentRoundLog
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object AgentRoundLogDao : BaseDao<AgentRoundLog>("nemo_agent_round_log") {
    val id = varchar("id", 32)
    val sessionId = varchar("session_id", 32)
    val fileIdList = text("file_id_list")
    val parentId = varchar("parent_id", 32)
    val role = varchar("role", 16)
    val content = text("content")
    val reasoningContent = text("reasoning_content")
    val spendTime = integer("spend_time")
    val toolCallResult = text("tool_call_result")

    override val primaryKey = PrimaryKey(id)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(fileIdList, toolCallResult)).also {
            it.fileIdList = JSONUtil.toList(row[fileIdList], String::class.java)
            it.toolCallResult = row[toolCallResult] ?: "[]"
        }
    }

    override fun createModel(): AgentRoundLog = AgentRoundLog()

    fun insert(roundLog: AgentRoundLog) {
        transaction {
            insert {
                it[id] = roundLog.id
                it[sessionId] = roundLog.sessionId
                it[fileIdList] = JSONUtil.toJsonStr(roundLog.fileIdList) ?: "[]"
                it[parentId] = roundLog.parentId
                it[role] = roundLog.role
                it[content] = roundLog.content
                it[reasoningContent] = roundLog.reasoningContent
                it[spendTime] = roundLog.spendTime
                it[toolCallResult] = roundLog.toolCallResult ?: "[]"
                it[createBy] = roundLog.createBy
                it[createTime] = System.currentTimeMillis()
                it[updateBy] = roundLog.updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun createId(): String = IdUtil.getSnowflakeNextIdStr()

    fun listBySessionId(sessionId: String): List<AgentRoundLog> {
        return transaction {
            select { self.sessionId eq sessionId }
                .orderBy(createTime, SortOrder.ASC)
                .map(mapper)
        }
    }

    fun getById(id: String): AgentRoundLog? {
        return transaction {
            select { self.id eq id }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getLastRoundLog(sessionId: String): AgentRoundLog? {
        return transaction {
            select { self.sessionId eq sessionId }
                .orderBy(createTime, SortOrder.DESC)
                .limit(1)
                .map(mapper)
                .firstOrNull()
        }
    }

    fun updateContent(id: String, content: String) {
        transaction {
            update({ self.id eq id }) {
                it[this.content] = content
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun updateToolResults(id: String, toolCallResult: String) {
        transaction {
            update({ self.id eq id }) {
                it[this.toolCallResult] = toolCallResult
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun countBySessionId(sessionId: String): Long {
        return transaction {
            select { self.sessionId eq sessionId }
                .count()
        }
    }
}
