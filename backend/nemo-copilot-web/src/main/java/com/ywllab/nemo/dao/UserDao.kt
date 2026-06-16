package com.ywllab.nemo.dao

import com.ywllab.nemo.model.User
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object UserDao : BaseDao<User>("nemo_user") {
    val userId = varchar("user_id", 32)
    val username = varchar("username", 190)
    val password = varchar("password", 190)
    val nickname = varchar("nickname", 190).nullable()
    val avatarUrl = varchar("avatar_url", 500).nullable()
    val email = varchar("email", 190).nullable()
    val phone = varchar("phone", 20).nullable()
    val registerIp = varchar("register_ip", 64).nullable()
    val lastLoginIp = varchar("last_login_ip", 64).nullable()
    val lastLoginTime = long("last_login_time").nullable()
    val status = varchar("status", 64).default("ACTIVE")
    override val primaryKey = PrimaryKey(userId)

    private val self = this

    override fun createModel(): User {
        return User()
    }

    fun getByUsername(username: String): User? {
        return transaction {
            select { self.username eq username }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getById(idParam: String): User? {
        return transaction {
            select { self.userId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByIds(ids: List<String>): List<User> {
        if (ids.isEmpty()) return emptyList()
        return transaction {
            select { self.userId inList ids }
                .map(mapper)
        }
    }

    fun getByEmail(email: String): User? {
        return transaction {
            select { self.email eq email }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByPhone(phone: String): User? {
        return transaction {
            select { self.phone eq phone }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun list(
        keyword: String? = null,
        status: String? = null,
        pageNum: Int = 1,
        pageSize: Int = 20
    ): Pair<List<User>, Long> {
        val pageQuery = com.ywllab.nemo.dto.PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery) {
            var condition: Op<Boolean> = Op.TRUE
            if (!keyword.isNullOrBlank()) {
                condition = (self.userId eq keyword)
                    .or(username like "%$keyword%")
                    .or(nickname like "%$keyword%")
                    .or(email like "%$keyword%")
            }
            if (!status.isNullOrBlank()) {
                condition = condition and (self.status eq status)
            }
            condition
        }
    }

    fun create(user: User, operator: String) {
        transaction {
            self.insert {
                it[userId] = user.userId
                it[username] = user.username
                it[password] = user.password
                it[nickname] = user.nickname
                it[avatarUrl] = user.avatarUrl
                it[email] = user.email
                it[phone] = user.phone
                it[registerIp] = user.registerIp
                it[lastLoginIp] = user.lastLoginIp
                it[lastLoginTime] = user.lastLoginTime
                it[status] = user.status
                it[createBy] = operator
                it[createTime] = System.currentTimeMillis()
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun update(user: User) {
        transaction {
            update({ userId eq user.userId }) {
                it[nickname] = user.nickname
                it[avatarUrl] = user.avatarUrl
                it[email] = user.email
                it[phone] = user.phone
                it[status] = user.status
                it[updateBy] = user.updateBy
                it[updateTime] = user.updateTime
            }
        }
    }

    fun updatePassword(userIdParam: String, newPassword: String) {
        transaction {
            update({ self.userId eq userIdParam }) {
                it[password] = newPassword
            }
        }
    }

    fun updateLastLoginTime(userIdParam: String) {
        transaction {
            update({ self.userId eq userIdParam }) {
                it[lastLoginTime] = System.currentTimeMillis()
            }
        }
    }

    fun updateAvatarUrl(userIdParam: String, avatarUrl: String) {
        transaction {
            update({ self.userId eq userIdParam }) {
                it[this.avatarUrl] = avatarUrl
            }
        }
    }

    fun updateEmail(userIdParam: String, newEmail: String) {
        transaction {
            update({ self.userId eq userIdParam }) {
                it[email] = newEmail
            }
        }
    }

    fun deleteById(idParam: String) {
        transaction {
            deleteWhere { self.userId eq idParam }
        }
    }
}
