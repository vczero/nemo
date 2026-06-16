package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.dao.AgreementDao
import com.ywllab.nemo.dao.UserAgreementDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.agreement.AgreementCreateRequest
import com.ywllab.nemo.dto.agreement.AgreementPageRequest
import com.ywllab.nemo.dto.agreement.AgreementPageResponse
import com.ywllab.nemo.dto.agreement.AgreementResponse
import com.ywllab.nemo.dto.agreement.AgreementUrlResponse
import com.ywllab.nemo.dto.agreement.UserAgreementPageRequest
import com.ywllab.nemo.dto.agreement.UserAgreementPageResponse
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.exception.ParamException
import com.ywllab.nemo.model.Agreement
import com.ywllab.nemo.model.UserAgreement
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.concurrent.ConcurrentHashMap

@Service
open class AgreementService {
    private val log = LoggerFactory.getLogger(AgreementService::class.java)

    @Value("\${app.advertise-url:}")
    private lateinit var advertiseUrl: String

    /**
     * 协议内容内存缓存，key 为 agreementId，value 为 HTML 内容
     */
    private val contentCache = ConcurrentHashMap<String, String>()

    open fun listAgreements(request: AgreementPageRequest): PageResultDto<AgreementPageResponse> {
        val (list, total) = AgreementDao.list(request)
        return PageResultDto(list, total, request.pageNum.toLong(), request.pageSize.toLong())
    }

    open fun getAgreementById(agreementId: String): AgreementResponse {
        val agreement = AgreementDao.getById(agreementId)
            ?: throw NotFoundException("协议不存在")
        return AgreementResponse().apply {
            this.agreementId = agreement.agreementId
            type = agreement.type
            version = agreement.version
            title = agreement.title
            content = agreement.content
            isActive = agreement.isActive
            effectiveDate = agreement.effectiveDate
            createBy = agreement.createBy
            createTime = agreement.createTime
            updateBy = agreement.updateBy
            updateTime = agreement.updateTime
        }
    }

    open fun getLatestAgreements(): List<AgreementUrlResponse> {
        val agreements = AgreementDao.getActiveList()

        return agreements.map { agreement ->
            AgreementUrlResponse().apply {
                agreementId = agreement.agreementId
                type = agreement.type
                title = agreement.title
                url = "$advertiseUrl/api/agreement/${agreement.agreementId}/preview"
            }
        }
    }

    /**
     * 获取协议内容用于预览（支持内存缓存）
     * @param agreementId 协议ID
     * @return HTML 内容
     */
    open fun getAgreementContentForPreview(agreementId: String): String {
        // 先从缓存获取
        contentCache[agreementId]?.let { return it }

        // 缓存不存在则查库
        val agreement = AgreementDao.getById(agreementId)
            ?: throw NotFoundException("协议不存在")

        // 缓存内容
        contentCache[agreementId] = agreement.content

        return agreement.content
    }

    @Transactional
    open fun createAgreement(request: AgreementCreateRequest): String {
        val userId = getUserId()

        // 检查同类型下版本号是否已存在
        if (AgreementDao.existsByVersion(request.version, request.type)) {
            throw ParamException("该协议类型下版本号已存在")
        }

        val now = System.currentTimeMillis()
        val agreementId = IdUtil.getSnowflakeNextIdStr()

        // 先创建协议（默认未激活）
        val agreement = Agreement().apply {
            this.agreementId = agreementId
            type = request.type
            version = request.version
            title = request.title
            content = request.content
            this.ossPath = ""
            isActive = 0
            effectiveDate = now
            createBy = userId
            createTime = now
            updateBy = userId
            updateTime = now
        }

        AgreementDao.create(agreement)

        // 如果设置为激活，则激活该协议（会自动将同类型其他协议设为未激活）
        val shouldActivate = request.isActive == 1
        log.info(
            "创建协议, agreementId={}, isActive={}, shouldActivate={}",
            agreementId,
            request.isActive,
            shouldActivate
        )
        if (shouldActivate) {
            AgreementDao.activate(agreementId, System.currentTimeMillis(), userId)
        }

        log.info(
            "创建协议成功, agreementId={}, type={}, version={}",
            agreement.agreementId,
            agreement.type,
            agreement.version
        )
        return agreement.agreementId
    }

    @Transactional
    open fun activateAgreement(agreementId: String, effectiveDate: Long?): String {
        val userId = getUserId()

        val agreement = AgreementDao.getById(agreementId)
            ?: throw NotFoundException("协议不存在")

        if (agreement.isActive == 1) {
            throw BizException("该协议已经是激活状态")
        }

        val effective = effectiveDate ?: System.currentTimeMillis()

        AgreementDao.activate(agreementId, effective, userId)

        log.info("激活协议成功, agreementId={}, type={}, effectiveDate={}", agreementId, agreement.type, effective)
        return agreementId
    }

    @Transactional
    open fun deleteAgreement(agreementId: String): String {
        val agreement = AgreementDao.getById(agreementId)
            ?: throw NotFoundException("协议不存在")

        // 已激活的协议不可删除
        if (agreement.isActive == 1) {
            throw BizException("已激活的协议不可删除")
        }

        // 有关联用户的协议不可删除
        val userCount = UserAgreementDao.countByAgreementId(agreementId)
        if (userCount > 0) {
            throw BizException("该协议已有 $userCount 个用户授权，不可删除")
        }

        AgreementDao.deleteById(agreementId)

        log.info("删除协议成功, agreementId={}", agreementId)
        return agreementId
    }

    open fun recordUserAgreementOnRegister(
        userId: String,
        agreementId: String,
        ipAddress: String?,
        userAgent: String?,
        deviceInfo: String?
    ) {
        val now = System.currentTimeMillis()
        val agreement = AgreementDao.getById(agreementId)!!
        val agreementRecord = UserAgreement().apply {
            agreementRecordId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            this.agreementId = agreementId
            agreementVersion = agreement.version
            this.ipAddress = ipAddress
            this.userAgent = userAgent
            this.deviceInfo = deviceInfo
            createBy = userId
            createTime = now
            updateBy = userId
            updateTime = now
        }
        UserAgreementDao.create(agreementRecord)
        log.info("记录用户协议授权成功, userId=${agreementRecord.userId}")
    }

    open fun listUserAgreements(request: UserAgreementPageRequest): PageResultDto<UserAgreementPageResponse> {
        val (list, total) = UserAgreementDao.list(request)
        return PageResultDto(list, total, request)
    }
}
