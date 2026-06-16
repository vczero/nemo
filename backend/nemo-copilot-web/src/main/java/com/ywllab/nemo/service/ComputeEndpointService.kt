package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.alibaba.fastjson.JSONObject
import com.ywllab.nemo.constant.ComputeEndpointStatus
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dao.ComputeEndpointDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.compute.ComputeEndpointDto
import com.ywllab.nemo.dto.compute.ComputeEndpointPageQuery
import com.ywllab.nemo.dto.compute.CreateComputeEndpointRequest
import com.ywllab.nemo.dto.compute.UpdateComputeEndpointRequest
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.model.compute.ComputeEndpoint
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.and
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
open class ComputeEndpointService {
    private val log = LoggerFactory.getLogger(javaClass)

    open fun createService(request: CreateComputeEndpointRequest): ComputeEndpointDto {
        val operator = UserSessionHelper.getUserId()
        val now = System.currentTimeMillis()
        val service = ComputeEndpoint().apply {
            endpointId = IdUtil.getSnowflakeNextIdStr()
            endpointName = request.endpointName
            execCategory = request.execCategory
            endpointType = request.endpointType
            endpointUrl = request.endpointUrl
            headers = request.headers
            mlServiceConfig = request.mlServiceConfig
            llmServiceConfig = request.llmServiceConfig
            maxRetry = request.maxRetry
            timeoutMs = request.timeoutMs
            status = ComputeEndpointStatus.ACTIVE
            createBy = operator
            createTime = now
            updateBy = operator
            updateTime = now
        }
        ComputeEndpointDao.create(service)
        log.info("创建计算服务配置, endpointId={}, endpointName={}", service.endpointId, service.endpointName)
        return toDto(service)
    }

    open fun updateService(endpointId: String, request: UpdateComputeEndpointRequest): ComputeEndpointDto {
        val service = ComputeEndpointDao.getByEndpointId(endpointId)
            ?: throw NotFoundException("计算服务不存在")
        val operator = UserSessionHelper.getUserId()
        request.endpointName?.let { service.endpointName = it }
        request.execCategory?.let { service.execCategory = it }
        request.endpointUrl?.let { service.endpointUrl = it }
        request.headers?.let { service.headers = it }
        request.mlServiceConfig?.let { service.mlServiceConfig = it }
        request.llmServiceConfig?.let { service.llmServiceConfig = it }
        request.maxRetry?.let { service.maxRetry = it }
        request.timeoutMs?.let { service.timeoutMs = it }
        service.updateBy = operator
        service.updateTime = System.currentTimeMillis()
        ComputeEndpointDao.updateById(service)
        log.info("更新计算服务配置, endpointId={}", endpointId)
        return toDto(service)
    }

    open fun updateStatus(endpointId: String, status: ComputeEndpointStatus): ComputeEndpointDto {
        val service = ComputeEndpointDao.getByEndpointId(endpointId)
            ?: throw NotFoundException("计算服务不存在")
        val operator = UserSessionHelper.getUserId()
        ComputeEndpointDao.updateStatus(endpointId, status.name, operator)
        service.status = status
        service.updateTime = System.currentTimeMillis()
        log.info("更新计算服务状态, endpointId={}, status={}", endpointId, status)
        return toDto(service)
    }

    open fun deleteService(endpointId: String) {
        val service = ComputeEndpointDao.getByEndpointId(endpointId)
            ?: throw NotFoundException("计算服务不存在")
        if (service.status == ComputeEndpointStatus.ACTIVE) {
            throw BizException("请先禁用端点再删除")
        }
        ComputeEndpointDao.delete(endpointId)
        log.info("删除计算服务配置, endpointId={}", endpointId)
    }

    open fun getService(endpointId: String): ComputeEndpointDto {
        val service = ComputeEndpointDao.getByEndpointId(endpointId)
            ?: throw NotFoundException("计算服务不存在")
        return toDto(service)
    }

    open fun pageServices(query: ComputeEndpointPageQuery): PageResultDto<ComputeEndpointDto> {
        val execCategoryVal = query.execCategory
        val endpointTypeVal = query.endpointType
        val statusVal = query.status
        val dao = ComputeEndpointDao
        val filter: org.jetbrains.exposed.sql.SqlExpressionBuilder.() -> Op<Boolean> = {
            var c: Op<Boolean> = Op.TRUE
            if (!execCategoryVal.isNullOrBlank()) {
                c = c.and(dao.execCategory eq execCategoryVal)
            }
            if (endpointTypeVal != null) {
                c = c.and(dao.endpointType eq endpointTypeVal)
            }
            if (!statusVal.isNullOrBlank()) {
                c = c.and(dao.status eq statusVal)
            }
            c
        }
        val (list, total) = dao.pageWithFilter(query, filter)
        val dtoList = list.map { toDto(it) }
        return PageResultDto(dtoList, total, query.pageNum.toLong(), query.pageSize.toLong())
    }

    open fun getActiveService(endpointId: String): ComputeEndpoint {
        val service = ComputeEndpointDao.getByEndpointId(endpointId)
            ?: throw NotFoundException("计算服务不存在")
        if (service.status != ComputeEndpointStatus.ACTIVE) {
            throw BizException("计算服务已停用")
        }
        return service
    }

    open fun getActiveEndpointByType(endpointType: ComputeType): ComputeEndpoint {
        val endpoint = ComputeEndpointDao.getActiveByEndpointType(endpointType)
            ?: throw NotFoundException("无可用的计算服务，类型: ${endpointType.name}")
        return endpoint
    }

    private fun toDto(service: ComputeEndpoint): ComputeEndpointDto {
        return ComputeEndpointDto().apply {
            this.endpointId = service.endpointId
            this.endpointName = service.endpointName
            this.execCategory = service.execCategory
            this.endpointType = service.endpointType
            this.endpointUrl = service.endpointUrl
            this.headers = service.headers
            this.mlServiceConfig = service.mlServiceConfig
            this.llmServiceConfig = service.llmServiceConfig
            this.maxRetry = service.maxRetry
            this.timeoutMs = service.timeoutMs
            this.status = service.status
            this.createTime = service.createTime
            this.updateTime = service.updateTime
        }
    }

    private fun parseJsonMap(jsonStr: String?): Map<String, Any>? {
        if (jsonStr.isNullOrBlank()) return null
        return try {
            @Suppress("UNCHECKED_CAST")
            JSONObject.parseObject(jsonStr) as Map<String, Any>
        } catch (e: Exception) {
            log.warn("解析JSON配置失败: {}", jsonStr, e)
            null
        }
    }
}
