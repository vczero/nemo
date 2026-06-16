package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.llm.LlmLogPageQuery
import com.ywllab.nemo.model.LlmLog
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object LlmLogDao : Table("nemo_llm_log") {
    val logId = varchar("log_id", 32)
    val bizType = enumerationByName<ComputeType>("biz_type", 64)
    val bizId = varchar("biz_id", 64)
    val userId = varchar("user_id", 32)
    val accountId = varchar("account_id", 32)
    val url = varchar("url", 1000)
    val model = varchar("model", 190)
    val inputContent = mediumText("input_content")
    val outputContent = mediumText("output_content").nullable()
    val inputTokenCount = integer("input_token_count").nullable()
    val outputTokenCount = integer("output_token_count").nullable()
    val totalTokenCount = integer("total_token_count").nullable()
    val createTime = long("create_time")
    val createBy = varchar("create_by", 64)

    override val primaryKey = PrimaryKey(logId)

    private val self = this

    val mapper = { row: ResultRow -> BaseDao.map(row, LlmLog()) }

    fun create(llmLog: LlmLog) {
        transaction {
            self.insert {
                it[logId] = llmLog.logId
                it[bizType] = llmLog.bizType
                it[bizId] = llmLog.bizId
                it[userId] = llmLog.userId
                it[accountId] = llmLog.accountId
                it[url] = llmLog.url
                it[model] = llmLog.model
                it[inputContent] = llmLog.inputContent
                it[outputContent] = llmLog.outputContent
                it[inputTokenCount] = llmLog.inputTokenCount
                it[outputTokenCount] = llmLog.outputTokenCount
                it[totalTokenCount] = llmLog.totalTokenCount
                it[createTime] = System.currentTimeMillis()
                it[createBy] = llmLog.createBy
            }
        }
    }

    fun update(llmLog: LlmLog) {
        transaction {
            update({ logId eq llmLog.logId }) {
                it[outputContent] = llmLog.outputContent
                it[inputTokenCount] = llmLog.inputTokenCount
                it[outputTokenCount] = llmLog.outputTokenCount
                it[totalTokenCount] = llmLog.totalTokenCount
            }
        }
    }

    fun getByLogId(logIdParam: String): LlmLog? {
        return transaction {
            select { self.logId eq logIdParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun delete(logIdParam: String) {
        transaction {
            deleteWhere { logId eq logIdParam }
        }
    }

    fun getByBizTypeAndBizId(bizTypeParam: ComputeType, bizIdParam: String): LlmLog? {
        return transaction {
            select { (self.bizType eq bizTypeParam) and (self.bizId eq bizIdParam) }
                .orderBy(createTime, SortOrder.DESC)
                .limit(1)
                .map(mapper).firstOrNull()
        }
    }

    fun page(query: LlmLogPageQuery): Pair<List<LlmLog>, Long> {
        var condition: Op<Boolean> = Op.TRUE
        query.userId?.let { condition = condition and (self.userId eq it) }
        query.bizType?.let { condition = condition and (self.bizType eq it) }
        query.startDate?.let { condition = condition and (createTime greaterEq it) }
        query.endDate?.let { condition = condition and (createTime lessEq it) }

        return transaction {
            val data = select { condition }
                .orderBy(createTime, SortOrder.DESC)
                .limit(query.pageSize.toInt(), query.offset())
                .map(mapper)
            val total = select { condition }.count()
            Pair(data, total)
        }
    }
}
