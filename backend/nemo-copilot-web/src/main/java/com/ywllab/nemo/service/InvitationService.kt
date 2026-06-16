package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.dao.InvitationCodeDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dao.UserInvitationDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.invitation.InvitationInfo
import com.ywllab.nemo.dto.invitation.InvitationRecordPageRequest
import com.ywllab.nemo.dto.invitation.InvitationRecordPageResponse
import com.ywllab.nemo.dto.invitation.InvitationRecordResponse
import com.ywllab.nemo.dto.invitation.PointAccountStats
import com.ywllab.nemo.model.UserInvitation
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
open class InvitationService {
    private val log = LoggerFactory.getLogger(InvitationService::class.java)

    @Autowired
    private lateinit var userAccountService: UserAccountService

    open fun info(userId: String): InvitationInfo {
        val invitationCode = InvitationCodeDao.getByInviterId(userId)?.code ?: ""
        return InvitationInfo().apply {
            this.invitationCode = invitationCode
            this.inviterRewardPoints = UserAccountService.INVITED_REWARD_POINTS
            this.inviteeRewardPoints = UserAccountService.INVITER_REWARD_POINTS
        }
    }

    open fun createInvitationRecord(inviterId: String, inviteeId: String, code: String) {
        val now = System.currentTimeMillis()
        val record = UserInvitation().apply {
            this.relationId = IdUtil.getSnowflakeNextIdStr()
            this.inviterId = inviterId
            this.inviteeId = inviteeId
            this.invitationCode = code
            this.inviteTime = now
            this.createBy = inviterId
            this.createTime = now
            this.updateBy = inviterId
            this.updateTime = now
        }

        UserInvitationDao.create(record)
        log.info("Created invitation record, inviterId={}, inviteeId={}, code={}", inviterId, inviteeId, code)
    }

    open fun getMyRecords(userId: String): List<InvitationRecordResponse> {
        val records = UserInvitationDao.getByInviterId(userId)

        return records.mapNotNull { record ->
            val invitee = UserDao.getById(record.inviteeId) ?: return@mapNotNull null
            InvitationRecordResponse().apply {
                this.inviteeUsername = invitee.username
                this.inviteeEmail = invitee.email
                this.inviteTime = record.inviteTime
            }
        }
    }

    open fun listRecords(request: InvitationRecordPageRequest): PageResultDto<InvitationRecordPageResponse> {
        val (list, total) = UserInvitationDao.list(request, UserDao)
        return PageResultDto(list, total, request.pageNum.toLong(), request.pageSize.toLong())
    }

    open fun getMyStatistics(userId: String): PointAccountStats {
        val invitedCount = UserInvitationDao.countByInviterId(userId)

        // 获取积分统计
        val pointsStats = userAccountService.getPointsStatistics(userId)

        return PointAccountStats().apply {
            this.invitedCount = invitedCount.toInt()
            this.totalPoints = pointsStats.totalUsed + pointsStats.balance
            this.usedPoints = pointsStats.totalUsed
            this.pointBalance = pointsStats.balance
        }
    }
}
