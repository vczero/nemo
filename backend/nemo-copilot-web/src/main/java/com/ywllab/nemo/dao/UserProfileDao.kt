package com.ywllab.nemo.dao

import com.ywllab.nemo.model.UserProfile
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object UserProfileDao : BaseDao<UserProfile>("nemo_user_profiles") {
    val userId = varchar("user_id", 32)
    val organization = varchar("organization", 190).nullable()
    val realName = varchar("real_name", 190).nullable()
    val province = varchar("province", 64).nullable()
    val city = varchar("city", 64).nullable()
    val bio = text("bio").nullable()
    override val primaryKey = PrimaryKey(userId)

    private val self = this

    override fun createModel(): UserProfile {
        return UserProfile()
    }

    fun getById(id: String): UserProfile? {
        return transaction {
            select { self.userId eq id }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getOrganization(userId: String): String? {
        return transaction {
            select { self.userId eq userId }
                .map { it[self.organization] }
                .firstOrNull()
        }
    }

    fun create(userId: String, organization: String, operator: String) {
        val now = System.currentTimeMillis()
        transaction {
            self.insert {
                it[self.userId] = userId
                it[self.organization] = organization
                it[realName] = null
                it[province] = null
                it[city] = null
                it[bio] = null
                it[self.createBy] = operator
                it[self.createTime] = now
                it[self.updateBy] = operator
                it[self.updateTime] = now
            }
        }
    }

    fun updateOrganization(userId: String, organization: String?) {
        transaction {
            update({ self.userId eq userId }) {
                it[self.organization] = organization
            }
        }
    }

    fun deleteById(id: String) {
        transaction {
            deleteWhere { self.userId eq id }
        }
    }
}
