package com.ywllab.nemo.dao

import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSONObject
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.model.compute.ComputeEndpoint
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object ComputeEndpointDao : BaseDao<ComputeEndpoint>("nemo_compute_endpoint") {
    val endpointId = varchar("endpoint_id", 32)
    val endpointName = varchar("endpoint_name", 64)
    val execCategory = varchar("exec_category", 16)
    val endpointType = enumerationByName<ComputeType>("endpoint_type", 32)
    val endpointUrl = varchar("endpoint_url", 500)
    val headers = text("headers").nullable()
    val mlServiceConfigCol = text("ml_service_config").nullable()
    val llmServiceConfigCol = text("llm_service_config").nullable()
    val maxRetry = integer("max_retry")
    val timeoutMs = integer("timeout_ms")
    val status = varchar("status", 32)

    override val primaryKey = PrimaryKey(endpointId)

    private val self = this

    override fun createModel(): ComputeEndpoint = ComputeEndpoint()

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(headers, mlServiceConfigCol, llmServiceConfigCol)).also { model ->
            model.headers = parseStringMap(row.getOrNull(headers))
            model.mlServiceConfig = parseJsonMap(row.getOrNull(mlServiceConfigCol))
            model.llmServiceConfig = parseJsonMap(row.getOrNull(llmServiceConfigCol))
        }
    }

    private fun parseJsonMap(value: String?): Map<String, Any>? {
        if (value.isNullOrBlank()) return null
        return try {
            JSONObject.parseObject(value)
        } catch (e: Exception) {
            null
        }
    }

    private fun parseStringMap(value: String?): Map<String, String>? {
        if (value.isNullOrBlank()) return null
        return try {
            val anyMap: Map<String, Any>? = JSONObject.parseObject(value)
            anyMap?.mapValues { it.value.toString() }
        } catch (e: Exception) {
            null
        }
    }

    fun create(service: ComputeEndpoint) {
        transaction {
            self.insert {
                it[endpointId] = service.endpointId
                it[endpointName] = service.endpointName
                it[execCategory] = service.execCategory.name
                it[endpointType] = service.endpointType
                it[endpointUrl] = service.endpointUrl
                it[headers] = toJsonStr(service.headers)
                it[mlServiceConfigCol] = toJsonStr(service.mlServiceConfig)
                it[llmServiceConfigCol] = toJsonStr(service.llmServiceConfig)
                it[maxRetry] = service.maxRetry
                it[timeoutMs] = service.timeoutMs
                it[status] = service.status.name
                it[createBy] = service.createBy
                it[createTime] = service.createTime
                it[updateBy] = service.updateBy
                it[updateTime] = service.updateTime
            }
        }
    }

    fun updateById(service: ComputeEndpoint) {
        transaction {
            update({ endpointId eq service.endpointId }) {
                it[endpointName] = service.endpointName
                it[execCategory] = service.execCategory.name
                it[endpointUrl] = service.endpointUrl
                it[headers] = toJsonStr(service.headers)
                it[mlServiceConfigCol] = toJsonStr(service.mlServiceConfig)
                it[llmServiceConfigCol] = toJsonStr(service.llmServiceConfig)
                it[maxRetry] = service.maxRetry
                it[timeoutMs] = service.timeoutMs
                it[updateBy] = service.updateBy
                it[updateTime] = service.updateTime
            }
        }
    }

    private fun toJsonStr(map: Map<String, Any>?): String? {
        return map?.let { JSONUtil.toJsonStr(it) }
    }

    fun updateStatus(endpointIdParam: String, newStatus: String, operator: String) {
        transaction {
            update({ self.endpointId eq endpointIdParam }) {
                it[status] = newStatus
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun getByEndpointId(endpointIdParam: String): ComputeEndpoint? {
        return transaction {
            self.select { self.endpointId eq endpointIdParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getActiveByEndpointType(endpointTypeParam: ComputeType): ComputeEndpoint? {
        return transaction {
            self.select { (self.endpointType eq endpointTypeParam) and (self.status eq "ACTIVE") }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun pageWithFilter(pageQuery: PageQuery, filter: SqlExpressionBuilder.() -> Op<Boolean>): Pair<List<ComputeEndpoint>, Long> {
        return page(pageQuery, createTime, SortOrder.DESC, filter)
    }
}
