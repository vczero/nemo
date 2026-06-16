package com.ywllab.nemo.dao

import com.ywllab.nemo.model.ChartFileRel
import com.ywllab.nemo.model.NemoFile
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insertIgnore
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

object ChartFileRelDao : Table("nemo_chart_file_rel") {
    val chartId = varchar("chart_id", 32)
    val fileId = varchar("file_id", 32)
    val createTime = long("create_time")
    val createBy = varchar("create_by", 64)

    override val primaryKey = PrimaryKey(chartId, fileId)

    private val self = this

    val mapper = { row: org.jetbrains.exposed.sql.ResultRow ->
        ChartFileRel().apply {
            chartId = row[self.chartId]
            fileId = row[self.fileId]
            createTime = row[self.createTime]
            createBy = row[self.createBy]
        }
    }

    fun save(rel: ChartFileRel) {
        transaction {
            self.insertIgnore {
                it[chartId] = rel.chartId
                it[fileId] = rel.fileId
                it[createTime] = rel.createTime
                it[createBy] = rel.createBy
            }
        }
    }

    fun getFileIdsByChartId(chartId: String): List<String> {
        return transaction {
            select { self.chartId eq chartId }
                .map { it[fileId] }
        }
    }

    fun deleteByChartId(chartId: String) {
        transaction {
            deleteWhere { self.chartId eq chartId }
        }
    }

    fun exists(chartId: String, fileId: String): Boolean {
        return transaction {
            select { (self.chartId eq chartId) and (self.fileId eq fileId) }
                .count() > 0
        }
    }

    fun getByChartId(chartId: String): List<NemoFile> {
        return transaction {
            val fileIds = select { self.chartId eq chartId }
                .map { it[self.fileId] }
            if (fileIds.isEmpty()) {
                emptyList()
            } else {
                FileDao.listByIds(fileIds)
            }
        }
    }
}
