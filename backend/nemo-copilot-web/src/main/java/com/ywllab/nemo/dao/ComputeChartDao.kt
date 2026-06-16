package com.ywllab.nemo.dao

import com.ywllab.nemo.model.compute.ComputeChart
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.replace
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

object ComputeChartDao : Table("nemo_compute_chart") {
    val taskId = varchar("task_id", 32)
    val chartId = varchar("chart_id", 32)
    val createTime = long("create_time")
    val createBy = varchar("create_by", 64)

    private val self = this

    fun save(chart: ComputeChart) {
        transaction {
            self.replace {
                it[taskId] = chart.taskId
                it[chartId] = chart.chartId
                it[createTime] = System.currentTimeMillis()
                it[createBy] = chart.createBy
            }
        }
    }

    fun getByTaskId(taskIdValue: String): List<ComputeChart> {
        return transaction {
            self.select { taskId eq taskIdValue }.map { row ->
                ComputeChart().apply {
                    this.taskId = row[self.taskId]
                    this.chartId = row[self.chartId]
                    this.createTime = row[self.createTime]
                    this.createBy = row[self.createBy]
                }
            }
        }
    }

    fun exist(taskId: String, chartId: String): Boolean {
        return transaction {
            self.select { self.taskId eq taskId and (self.chartId eq chartId) }.count() > 0
        }
    }

    fun deleteByTaskId(taskId: String) {
        transaction {
            self.deleteWhere { self.taskId eq taskId }
        }
    }

    fun deleteByChartId(chartId: String) {
        transaction {
            self.deleteWhere { self.chartId eq chartId }
        }
    }

    fun chartIdMap(chartIds: List<String>): Map<String, String> {
        if (chartIds.isEmpty()) {
            return emptyMap()
        }
        return transaction {
            self.slice(taskId, chartId).select { chartId inList chartIds }
                .associate { row -> row[self.chartId] to row[self.taskId] }
        }
    }
}
