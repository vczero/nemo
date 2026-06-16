package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.token.TokenUsageRecordPageQuery
import com.ywllab.nemo.model.TokenUsageRecord
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.sum
import org.jetbrains.exposed.sql.transactions.transaction

object TokenUsageRecordDao : BaseDao<TokenUsageRecord>("nemo_token_usage_record") {
    val recordId = varchar("record_id", 32)
    val accountId = varchar("account_id", 32)
    val orderId = varchar("order_id", 32).nullable()
    val productId = varchar("product_id", 32).nullable()
    val usedAmount = long("used_amount")
    val balanceBefore = long("balance_before")
    val balanceAfter = long("balance_after")
    val bizType = enumerationByName<ComputeType>("biz_type", 32)
    val bizId = varchar("biz_id", 64).nullable()
    val remark = varchar("remark", 256).nullable()

    override val primaryKey = PrimaryKey(recordId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(self.bizType)).also {
            it.bizType = row[self.bizType]
        }
    }

    override fun createModel(): TokenUsageRecord {
        return TokenUsageRecord()
    }

    fun create(record: TokenUsageRecord, userId: String) {
        transaction {
            self.insert {
                it[recordId] = record.recordId
                it[accountId] = record.accountId
                it[orderId] = record.orderId
                it[productId] = record.productId
                it[usedAmount] = record.usedAmount
                it[balanceBefore] = record.balanceBefore
                it[balanceAfter] = record.balanceAfter
                it[bizType] = record.bizType
                it[bizId] = record.bizId
                it[remark] = record.remark
                it[createBy] = userId
                it[updateBy] = userId
                it[createTime] = System.currentTimeMillis()
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    /**
     * 查询订单已使用的Token总量
     */
    fun getUsedAmountByOrderId(orderIdParam: String): Long {
        return transaction {
            val sumExpr = usedAmount.sum()
            select { self.orderId eq orderIdParam }
                .map { it[sumExpr] ?: 0L }
                .firstOrNull() ?: 0L
        }
    }

    /**
     * 查询订单的消耗记录列表
     */
    fun getByOrderId(orderIdParam: String): List<TokenUsageRecord> {
        return transaction {
            select { self.orderId eq orderIdParam }
                .map(mapper)
        }
    }

    /**
     * 查询账户的消耗记录列表
     */
    fun getByAccountId(accountIdParam: String): List<TokenUsageRecord> {
        return transaction {
            select { self.accountId eq accountIdParam }
                .orderBy(createTime, SortOrder.DESC)
                .map(mapper)
        }
    }

    fun page(query: TokenUsageRecordPageQuery): Pair<List<TokenUsageRecord>, Long> {
        var condition: Op<Boolean> = Op.TRUE
        query.accountId?.let { condition = condition and (self.accountId eq it) }
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
