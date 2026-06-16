package com.ywllab.nemo.dao

import com.ywllab.nemo.dto.invitation.InvitationCodePageRequest
import com.ywllab.nemo.dto.invitation.InvitationCodePageResponse
import com.ywllab.nemo.model.InvitationCode
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object InvitationCodeDao : BaseDao<InvitationCode>("nemo_invitation_codes") {
    val invitationCodeId = varchar("invitation_code_id", 32)
    val code = varchar("code", 20)
    val inviterId = varchar("inviter_id", 32)
    val usedCount = integer("used_count")
    override val primaryKey = PrimaryKey(invitationCodeId)

    private val self = this

    override fun createModel(): InvitationCode {
        return InvitationCode()
    }

    fun getByCode(codeParam: String): InvitationCode? {
        return transaction {
            select { self.code eq codeParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByInviterId(inviterIdParam: String): InvitationCode? {
        return transaction {
            select { self.inviterId eq inviterIdParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun create(invitationCode: InvitationCode) {
        transaction {
            self.insert {
                it[invitationCodeId] = invitationCode.invitationCodeId
                it[code] = invitationCode.code
                it[inviterId] = invitationCode.inviterId
                it[usedCount] = invitationCode.usedCount
                it[createBy] = invitationCode.createBy
                it[createTime] = invitationCode.createTime
                it[updateBy] = invitationCode.updateBy
                it[updateTime] = invitationCode.updateTime
            }
        }
    }

    fun incrementUsedCount(idParam: String) {
        transaction {
            update({ self.invitationCodeId eq idParam }) {
                it[usedCount] = usedCount + 1
            }
        }
    }

    fun list(request: InvitationCodePageRequest, userDao: UserDao): Pair<List<InvitationCodePageResponse>, Long> {
        val sortBy = request.sortBy ?: "update_time"
        val sortOrder = if (request.sortOrder == "ASC") SortOrder.ASC else SortOrder.DESC
        val sortColumn = when (sortBy) {
            "used_count" -> usedCount
            "update_time" -> updateTime
            else -> createTime
        }

        val (data, total) = page(request, sortColumn, sortOrder) {
            var condition: Op<Boolean> = Op.TRUE
            if (!request.code.isNullOrBlank()) {
                condition = condition and (code like "%${request.code}%")
            }
            if (request.inviterId != null) {
                condition = condition and (inviterId eq request.inviterId!!)
            }
            if (!request.inviterKeyword.isNullOrBlank()) {
                val (users, _) = userDao.list(request.inviterKeyword!!, null, 1, 100)
                val userIds = users.map { it.userId }
                if (userIds.isNotEmpty()) {
                    condition = condition and (inviterId inList userIds)
                }
            }
            condition
        }

        val list = data.map { invCode ->
            val response = InvitationCodePageResponse()
            response.invitationCodeId = invCode.invitationCodeId
            response.code = invCode.code
            response.inviterId = invCode.inviterId
            response.usedCount = invCode.usedCount
            response.createTime = invCode.createTime
            response.updateTime = invCode.updateTime

            val inviter = userDao.get(invCode.inviterId)
            response.inviterUsername = inviter?.username
            response.inviterEmail = inviter?.email
            response
        }
        return Pair(list, total)
    }
}
