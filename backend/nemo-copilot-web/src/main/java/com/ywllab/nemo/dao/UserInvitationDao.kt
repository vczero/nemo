package com.ywllab.nemo.dao

import com.ywllab.nemo.dto.invitation.InvitationRecordPageRequest
import com.ywllab.nemo.dto.invitation.InvitationRecordPageResponse
import com.ywllab.nemo.model.UserInvitation
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

object UserInvitationDao : BaseDao<UserInvitation>("nemo_user_invitations") {
    val relationId = varchar("relation_id", 32)
    val inviterId = varchar("inviter_id", 32)
    val inviteeId = varchar("invitee_id", 32)
    val invitationCode = varchar("invitation_code", 10)
    val inviteTime = long("invite_time")

    override val primaryKey = PrimaryKey(relationId)

    private val self = this

    override fun createModel(): UserInvitation {
        return UserInvitation()
    }

    fun create(userInvitation: UserInvitation) {
        transaction {
            self.insert {
                it[relationId] = userInvitation.relationId
                it[inviterId] = userInvitation.inviterId
                it[inviteeId] = userInvitation.inviteeId
                it[invitationCode] = userInvitation.invitationCode
                it[inviteTime] = userInvitation.inviteTime
                it[createBy] = userInvitation.createBy
                it[createTime] = userInvitation.createTime
                it[updateBy] = userInvitation.updateBy
                it[updateTime] = userInvitation.updateTime
            }
        }
    }

    fun getByInviterId(inviterIdParam: String): List<UserInvitation> {
        return transaction {
            select { self.inviterId eq inviterIdParam }
                .map(mapper)
        }
    }

    fun countByInviterId(inviterIdParam: String): Long {
        return transaction {
            select { self.inviterId eq inviterIdParam }
                .count()
        }
    }

    fun list(request: InvitationRecordPageRequest, userDao: UserDao): Pair<List<InvitationRecordPageResponse>, Long> {
        val pageQuery = com.ywllab.nemo.dto.PageQuery().apply {
            pageNum = request.pageNum.toLong()
            pageSize = request.pageSize.toLong()
        }

        val sortOrder = if (request.sortOrder == "ASC") SortOrder.ASC else SortOrder.DESC

        val (data, total) = page(pageQuery, createTime, sortOrder) {
            var condition: Op<Boolean> = Op.TRUE
            if (!request.invitationCode.isNullOrBlank()) {
                condition = condition and (invitationCode like "%${request.invitationCode}%")
            }
            if (request.inviterId != null) {
                condition = condition and (inviterId eq request.inviterId!!)
            }
            if (!request.inviterKeyword.isNullOrBlank()) {
                val (users, _) = userDao.list(request.inviterKeyword!!, null, 1, 100)
                val userIds = users.mapNotNull { it.userId }
                if (userIds.isNotEmpty()) {
                    condition = condition and (inviterId inList userIds)
                }
            }
            if (request.inviteeId != null) {
                condition = condition and (inviteeId eq request.inviteeId!!)
            }
            if (!request.inviteeKeyword.isNullOrBlank()) {
                val (users, _) = userDao.list(request.inviteeKeyword!!, null, 1, 100)
                val userIds = users.mapNotNull { it.userId }
                if (userIds.isNotEmpty()) {
                    condition = condition and (inviteeId inList userIds)
                }
            }
            condition
        }

        val list = data.map { record ->
            val response = InvitationRecordPageResponse()
            response.id = record.relationId
            response.inviterId = record.inviterId
            response.inviteeId = record.inviteeId
            response.invitationCode = record.invitationCode
            response.inviteTime = record.inviteTime

            val inviter = userDao.getById(record.inviterId)
            val invitee = userDao.getById(record.inviteeId)
            response.inviterUsername = inviter?.username
            response.inviterEmail = inviter?.email
            response.inviteeUsername = invitee?.username
            response.inviteeEmail = invitee?.email
            response
        }
        return Pair(list, total)
    }
}
