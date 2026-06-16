package com.ywllab.nemo.dao

import com.ywllab.nemo.dto.agreement.UserAgreementPageRequest
import com.ywllab.nemo.dto.agreement.UserAgreementPageResponse
import com.ywllab.nemo.model.UserAgreement
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

object UserAgreementDao : BaseDao<UserAgreement>("nemo_user_agreement") {
    val agreementRecordId = varchar("agreement_record_id", 32)
    val userId = varchar("user_id", 32)
    val agreementId = varchar("agreement_id", 32)
    val agreementVersion = varchar("agreement_version", 32)
    val ipAddress = varchar("ip_address", 64).nullable()
    val userAgent = varchar("user_agent", 500).nullable()
    val deviceInfo = varchar("device_info", 500).nullable()
    override val primaryKey = PrimaryKey(agreementRecordId)

    private val self = this

    override fun createModel(): UserAgreement {
        return UserAgreement()
    }

    fun getByUserIdAndAgreementId(userId: String, agreementId: String): UserAgreement? {
        return transaction {
            select { (self.userId eq userId) and (self.agreementId eq agreementId) }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByUserId(userId: String): List<UserAgreement> {
        return transaction {
            select { self.userId eq userId }
                .map(mapper)
        }
    }

    fun list(request: UserAgreementPageRequest): Pair<List<UserAgreementPageResponse>, Long> {
        return transaction {
            var condition: Op<Boolean> = Op.TRUE

            val filterUserId = request.userId
            if (!filterUserId.isNullOrBlank()) {
                condition = condition and (self.userId eq filterUserId)
            }

            val startTime = request.startTime
            if (startTime != null) {
                condition = condition and (createTime greaterEq startTime)
            }

            val endTime = request.endTime
            if (endTime != null) {
                condition = condition and (createTime lessEq endTime)
            }

            val total = select(condition).count()

            val data = select(condition)
                .orderBy(createTime, org.jetbrains.exposed.sql.SortOrder.DESC)
                .limit(request.pageSize.toInt(), request.offset())
                .map { row ->
                    UserAgreementPageResponse().apply {
                        agreementRecordId = row[self.agreementRecordId]
                        userId = row[self.userId]
                        agreementId = row[self.agreementId]
                        agreementVersion = row[self.agreementVersion]
                        ipAddress = row[self.ipAddress]
                        userAgent = row[self.userAgent]
                        deviceInfo = row[self.deviceInfo]
                        createTime = row[self.createTime]
                    }
                }

            // 获取用户信息
            val userIds = data.map { it.userId }.distinct()
            val users = if (userIds.isNotEmpty()) {
                UserDao.getByIds(userIds)
            } else {
                emptyList()
            }
            val userMap = users.associateBy { it.userId }

            // 获取协议信息
            val agreementIds = data.map { it.agreementId }.distinct()
            val agreements = agreementIds.mapNotNull { AgreementDao.getById(it) }
            val agreementMap = agreements.associateBy { it.agreementId }

            data.forEach { response ->
                userMap[response.userId]?.let { user ->
                    response.username = user.username
                    response.email = user.email
                }
                agreementMap[response.agreementId]?.let { agreement ->
                    response.agreementTitle = agreement.title
                }
            }

            Pair(data, total)
        }
    }

    fun countByAgreementId(agreementId: String): Long {
        return transaction {
            select { self.agreementId eq agreementId }.count()
        }
    }

    fun create(userAgreement: UserAgreement) {
        transaction {
            self.insert {
                it[agreementRecordId] = userAgreement.agreementRecordId
                it[userId] = userAgreement.userId
                it[agreementId] = userAgreement.agreementId
                it[agreementVersion] = userAgreement.agreementVersion
                it[ipAddress] = userAgreement.ipAddress
                it[userAgent] = userAgreement.userAgent
                it[deviceInfo] = userAgreement.deviceInfo
                it[createBy] = userAgreement.createBy
                it[createTime] = userAgreement.createTime
                it[updateBy] = userAgreement.updateBy
                it[updateTime] = userAgreement.updateTime
            }
        }
    }
}
