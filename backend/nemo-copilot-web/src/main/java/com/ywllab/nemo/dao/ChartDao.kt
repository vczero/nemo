package com.ywllab.nemo.dao

import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSONObject
import com.ywllab.nemo.model.Chart
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object ChartDao : BaseDao<Chart>("nemo_chart") {
    val chartId = varchar("chart_id", 32)
    val userId = varchar("user_id", 32)
    val chartName = varchar("chart_name", 190)
    val chartConfig = text("chart_config")
    val chartThumbnailPath = varchar("chart_thumbnail_path", 190).nullable()
    val interpretContent = text("interpret_content").nullable()
    val interpretContentEn = text("interpret_content_en").nullable()
    val purpose = varchar("purpose", 500).nullable()

    override val primaryKey = PrimaryKey(chartId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(chartConfig)).also {
            it.chartConfig = if (row.getOrNull(chartConfig)?.isNotBlank() == true) {
                JSONObject.parseObject(row[chartConfig])
            } else {
                mapOf()
            }
        }
    }

    override fun createModel(): Chart = Chart()

    fun create(chart: Chart) {
        transaction {
            self.insert {
                it[chartId] = chart.chartId
                it[userId] = chart.userId
                it[chartName] = chart.chartName
                it[chartConfig] = JSONUtil.toJsonStr(chart.chartConfig)
                it[chartThumbnailPath] = chart.chartThumbnailPath
                it[interpretContent] = chart.interpretContent
                it[interpretContentEn] = chart.interpretContentEn
                it[purpose] = chart.purpose
                it[createBy] = chart.createBy
                it[createTime] = chart.createTime
                it[updateBy] = chart.updateBy
                it[updateTime] = chart.updateTime
            }
        }
    }

    fun update(chart: Chart) {
        transaction {
            update({ self.chartId eq chart.chartId }) {
                it[chartName] = chart.chartName
                it[chartConfig] = JSONUtil.toJsonStr(chart.chartConfig)
                it[chartThumbnailPath] = chart.chartThumbnailPath
                it[updateBy] = chart.updateBy
                it[updateTime] = chart.updateTime
            }
        }
    }

    fun updateThumbnailPath(chartId: String, thumbnailPath: String?) {
        transaction {
            update({ self.chartId eq chartId }) {
                it[chartThumbnailPath] = thumbnailPath
            }
        }
    }

    fun updateInterpretContent(chartId: String, content: String, purpose: String?, updateBy: String) {
        transaction {
            update({ self.chartId eq chartId }) {
                it[interpretContent] = content
                it[self.purpose] = purpose
                it[self.updateBy] = updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun updateInterpretContentEn(chartId: String, contentEn: String?, updateBy: String) {
        transaction {
            update({ self.chartId eq chartId }) {
                it[interpretContentEn] = contentEn
                it[self.updateBy] = updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun deleteByChartId(chartId: String) {
        transaction {
            deleteWhere { self.chartId eq chartId }
        }
    }

    fun getByChartId(chartId: String, withChartConfig: Boolean = true): Chart? {
        val cols = if (!withChartConfig) {
            val cols = self.columns.toMutableList()
            cols.remove(self.chartConfig)
            cols
        } else {
            self.columns
        }
        return transaction {
            slice(cols).select { self.chartId eq chartId }
                .map(mapper)
                .firstOrNull()
        }
    }

    /**
     * 分页查询用户的图表
     */
    fun pageByUserId(userId: String, pageNum: Int, pageSize: Int, keyword: String? = null): Pair<List<Chart>, Long> {
        return transaction {
            val where: Op<Boolean> = if (keyword.isNullOrBlank()) {
                self.userId eq userId
            } else {
                (self.userId eq userId) and ((self.chartId like "%$keyword%") or (self.chartName like "%$keyword%"))
            }
            val data = slice(
                self.chartThumbnailPath,
                self.chartName,
                self.chartId,
                self.createTime,
                self.updateTime,
                self.interpretContent,
                self.interpretContentEn,
                self.purpose
            )
                .select(where)
                .orderBy(updateTime, SortOrder.DESC)
                .limit(pageSize, (pageNum - 1) * pageSize.toLong())
                .map(mapper)
            val total = select(where).count()
            Pair(data, total)
        }
    }
}
