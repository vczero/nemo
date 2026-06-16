package com.ywllab.nemo.dao

import cn.hutool.core.util.ReflectUtil
import cn.hutool.core.util.StrUtil
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.model.BaseColumn
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.ExpressionAlias
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

abstract class BaseDao<T : BaseColumn>(tableName: String) : Table(tableName) {

    val createBy = varchar("create_by", 64)
    val createTime = long("create_time")
    val updateBy = varchar("update_by", 64)
    val updateTime = long("update_time")

    open val mapper = { row: ResultRow -> map(row, createModel()) }

    companion object {
        fun <T> map(row: ResultRow, result: T, skipColumns: List<Column<*>> = listOf()): T {
            val skipColumnNames = skipColumns.map { it.name }.toSet()
            val columns = row.fieldIndex.toList()
            columns.forEach {
                val col = it.first
                val columnName = if (col is Column) col.name else (col as ExpressionAlias).alias
                if (!skipColumnNames.contains(columnName)) {
                    val field = StrUtil.toCamelCase(columnName)
                    ReflectUtil.setFieldValue(result, field, row[col])
                }
            }
            return result
        }
    }

    abstract fun createModel(): T

    fun page(pageQuery: PageQuery, where: SqlExpressionBuilder.() -> Op<Boolean>): Pair<List<T>, Long> {
        return page(pageQuery, createTime, SortOrder.DESC, where)
    }

    fun page(
        pageQuery: PageQuery,
        orderColumn: Column<*>,
        order: SortOrder,
        where: SqlExpressionBuilder.() -> Op<Boolean>
    ): Pair<List<T>, Long> {
        return transaction {
            val data = select(where)
                .orderBy(orderColumn, order)
                .limit(pageQuery.pageSize.toInt(), pageQuery.offset())
                .map(mapper)
            Pair(data, select(where).count())
        }
    }

    @Suppress("UNCHECKED_CAST")
    open fun get(id: String): T? {
        return transaction {
            select { primaryKey!!.columns[0] as Column<String> eq id }.map(mapper).firstOrNull()
        }
    }

    @Suppress("UNCHECKED_CAST")
    fun delete(id: String) {
        transaction {
            deleteWhere { primaryKey!!.columns[0] as Column<String> eq id }
        }
    }
}
