package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.PointsRecordType
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.model.PointsRecord
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.ZoneOffset

object PointsRecordDao : BaseDao<PointsRecord>("nemo_points_record") {
    val recordId = varchar("record_id", 32)
    val accountId = varchar("account_id", 32)
    val points = integer("points")
    val balanceBefore = integer("balance_before")
    val balanceAfter = integer("balance_after")
    val type = enumerationByName<PointsRecordType>("type", 32)
    val bizId = varchar("biz_id", 32).nullable()
    val bizType = varchar("biz_type", 32).nullable()
    val remark = varchar("remark", 256).nullable()
    override val primaryKey = PrimaryKey(recordId)

    private val self = this

    override fun createModel(): PointsRecord {
        return PointsRecord()
    }

    fun getById(idParam: String): PointsRecord? {
        return transaction {
            select { self.recordId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun listByAccountId(
        accountIdParam: String,
        typeParam: PointsRecordType? = null,
        pageNum: Int = 1,
        pageSize: Int = 20
    ): Pair<List<PointsRecord>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery, createTime, SortOrder.DESC) {
            var condition: Op<Boolean> = self.accountId eq accountIdParam
            if (typeParam != null) {
                condition = condition and (self.type eq typeParam)
            }
            condition
        }
    }

    fun create(record: PointsRecord) {
        transaction {
            self.insert {
                it[recordId] = record.recordId
                it[accountId] = record.accountId
                it[points] = record.points
                it[balanceBefore] = record.balanceBefore
                it[balanceAfter] = record.balanceAfter
                it[type] = record.type
                it[bizId] = record.bizId
                it[bizType] = record.bizType
                it[remark] = record.remark
                it[createBy] = record.createBy
                it[createTime] = record.createTime
                it[updateBy] = record.updateBy
                it[updateTime] = record.updateTime
            }
        }
    }

    fun countByAccountId(accountIdParam: String): Long {
        return transaction {
            select { self.accountId eq accountIdParam }.count()
        }
    }

    /**
     * 计算用户当年已抵扣积分总额（返回正数）
     */
    fun getAnnualDeductedPoints(accountIdParam: String, year: Int): Int {
        val startOfYear = LocalDate.of(year, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        val endOfYear = LocalDate.of(year, 12, 31).atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant().toEpochMilli()

        return transaction {
            slice(self.points).select {
                (self.accountId eq accountIdParam)
                    .and(self.type eq PointsRecordType.ORDER_DEDUCT)
                    .and(self.createTime greaterEq startOfYear)
                    .and(self.createTime lessEq endOfYear)
            }.sumOf { -it[points] }
        }
    }
}
