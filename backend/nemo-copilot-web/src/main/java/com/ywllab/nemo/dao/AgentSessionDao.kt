package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.AgentType
import com.ywllab.nemo.model.AgentSession
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object AgentSessionDao : BaseDao<AgentSession>("nemo_agent_session") {
    val sessionId = varchar("session_id", 32)
    val type = enumerationByName("type", 190, AgentType::class)
    val summary = varchar("summary", 190).default("")
    val queryNum = integer("query_num")
    val deleted = bool("deleted")
    val userId = varchar("user_id", 32)

    override val primaryKey = PrimaryKey(sessionId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf())
    }

    override fun createModel(): AgentSession = AgentSession()

    fun insert(session: AgentSession) {
        transaction {
            insert {
                it[sessionId] = session.sessionId
                it[type] = session.type
                it[summary] = session.summary
                it[queryNum] = session.queryNum
                it[deleted] = session.deleted
                it[userId] = session.userId
                it[createBy] = session.createBy
                it[createTime] = System.currentTimeMillis()
                it[updateBy] = session.updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun getBySessionId(sessionId: String): AgentSession? {
        return transaction {
            select { self.sessionId eq sessionId and deleted.eq(false) }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun listSessions(userId: String): List<AgentSession> {
        return transaction {
            select { self.userId.eq(userId) and deleted.eq(false) }
                .orderBy(createTime, SortOrder.DESC)
                .map(mapper)
        }
    }

    fun updateSummary(sessionId: String, summary: String, queryNum: Int, updateBy: String) {
        transaction {
            update({ self.sessionId eq sessionId }) {
                it[this.summary] = summary
                it[this.queryNum] = queryNum
                it[this.updateBy] = updateBy
                it[this.updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun updateSummaryOnly(sessionId: String, summary: String, updateBy: String) {
        transaction {
            update({ self.sessionId eq sessionId }) {
                it[this.summary] = summary
                it[this.updateBy] = updateBy
                it[this.updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun softDelete(sessionId: String) {
        transaction {
            update({ self.sessionId eq sessionId }) {
                it[deleted] = true
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun incQueryNum(sessionId: String) {
        transaction {
            val session = getBySessionId(sessionId) ?: return@transaction
            update({ self.sessionId eq sessionId }) {
                it[queryNum] = session.queryNum + 1
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }
}
