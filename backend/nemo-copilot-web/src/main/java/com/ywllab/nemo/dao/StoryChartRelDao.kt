package com.ywllab.nemo.dao

import com.ywllab.nemo.model.StoryChartRel
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.minus
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object StoryChartRelDao : BaseDao<StoryChartRel>("nemo_story_chart_rel") {
    val storyId = varchar("story_id", 32)
    val chartId = varchar("chart_id", 32)
    val description = text("description").nullable()
    val sortOrder = integer("sort_order")

    override val primaryKey = PrimaryKey(storyId, chartId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf())
    }

    override fun createModel(): StoryChartRel = StoryChartRel()

    fun create(rel: StoryChartRel) {
        val maxSortOrder = getMaxSortOrder(rel.storyId)
        transaction {
            self.insert {
                it[storyId] = rel.storyId
                it[chartId] = rel.chartId
                it[description] = rel.description
                it[sortOrder] = maxSortOrder + 1
                it[createBy] = rel.createBy
                it[createTime] = System.currentTimeMillis()
                it[updateBy] = rel.updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun update(rel: StoryChartRel) {
        transaction {
            update({ (self.storyId eq rel.storyId) and (self.chartId eq rel.chartId) }) {
                it[description] = rel.description
                it[updateBy] = rel.updateBy
                it[updateTime] = rel.updateTime
            }
        }
    }

    fun deleteByStoryIdAndChartId(storyId: String, chartId: String) {
        transaction {
            deleteWhere { (self.storyId eq storyId) and (self.chartId eq chartId) }
        }
    }

    fun deleteByStoryId(storyId: String) {
        transaction {
            deleteWhere { self.storyId eq storyId }
        }
    }

    fun getByStoryId(storyId: String): List<StoryChartRel> {
        return transaction {
            select { self.storyId eq storyId }
                .orderBy(sortOrder, SortOrder.ASC)
                .map(mapper)
        }
    }

    fun countByStoryId(storyId: String): Long {
        return transaction {
            select { self.storyId eq storyId }
                .orderBy(sortOrder, SortOrder.ASC)
                .count()
        }
    }

    fun getMaxSortOrder(storyId: String): Int {
        return transaction {
            slice(listOf(sortOrder))
                .select { self.storyId eq storyId }
                .orderBy(sortOrder, SortOrder.DESC)
                .map { it[sortOrder] }
                .firstOrNull() ?: 0
        }
    }

    fun getByStoryIdAndChartId(storyId: String, chartId: String): StoryChartRel? {
        return transaction {
            select { (self.storyId eq storyId) and (self.chartId eq chartId) }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByChartId(chartId: String): List<StoryChartRel> {
        return transaction {
            select { self.chartId eq chartId }.map(mapper)
        }
    }

    fun updateSortOrder(storyId: String, chartId: String, insertPosition: Int) {
        transaction {
            update({
                self.storyId eq storyId and
                    (self.chartId neq chartId) and
                    self.sortOrder.greaterEq(insertPosition)
            }) {
                it[sortOrder] = self.sortOrder + 1
            }
        }
    }

    fun decrementSortOrdersAfter(storyId: String, removedSortOrder: Int) {
        transaction {
            update({
                self.storyId eq storyId and
                    self.sortOrder.greater(removedSortOrder)
            }) {
                it[sortOrder] = self.sortOrder - 1
            }
        }
    }
}
