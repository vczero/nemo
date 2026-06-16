package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import cn.hutool.core.util.RandomUtil
import com.ywllab.nemo.dao.InvitationCodeDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dao.UserInvitationDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.invitation.InvitationCodePageRequest
import com.ywllab.nemo.dto.invitation.InvitationCodePageResponse
import com.ywllab.nemo.dto.invitation.InvitationStatisticsResponse
import com.ywllab.nemo.model.InvitationCode
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
open class InvitationCodeService {
    private val log = LoggerFactory.getLogger(InvitationCodeService::class.java)

    open fun listCodes(request: InvitationCodePageRequest): PageResultDto<InvitationCodePageResponse> {
        val (list, total) = InvitationCodeDao.list(request, UserDao)
        return PageResultDto(list, total, request.pageNum.toLong(), request.pageSize.toLong())
    }

    open fun getStatistics(): InvitationStatisticsResponse {
        return transaction {
            val totalCodes = InvitationCodeDao.selectAll().count().toInt()
            val totalInvitations = UserInvitationDao.selectAll().count().toInt()

            val totalInviters = InvitationCodeDao.selectAll()
                .map { it[InvitationCodeDao.inviterId] }
                .distinct()
                .count()

            val totalInvitees = UserInvitationDao.selectAll()
                .map { it[UserInvitationDao.inviteeId] }
                .distinct()
                .count()

            InvitationStatisticsResponse().apply {
                this.totalCodes = totalCodes
                this.totalInvitations = totalInvitations
                this.totalInviters = totalInviters
                this.totalInvitees = totalInvitees
            }
        }
    }

    open fun getOrCreateCode(userId: String): InvitationCode {
        var code = InvitationCodeDao.getByInviterId(userId)
        if (code == null) {
            val now = System.currentTimeMillis()
            code = InvitationCode().apply {
                this.invitationCodeId = IdUtil.getSnowflakeNextIdStr()
                this.code = generateUniqueCode()
                this.inviterId = userId
                this.usedCount = 0
                this.createBy = userId
                this.createTime = now
                this.updateBy = userId
                this.updateTime = now
            }
            InvitationCodeDao.create(code)
            log.info("Created invitation code for user, userId={}, code={}", userId, code.code)
        }
        return code
    }

    open fun validateAndUseCode(code: String): InvitationCode? {
        val invitationCode = InvitationCodeDao.getByCode(code) ?: return null
        InvitationCodeDao.incrementUsedCount(invitationCode.invitationCodeId)
        return invitationCode
    }

    private fun generateUniqueCode(): String {
        var code: String
        do {
            code = RandomUtil.randomString(10).uppercase()
        } while (InvitationCodeDao.getByCode(code) != null)
        return code
    }
}
