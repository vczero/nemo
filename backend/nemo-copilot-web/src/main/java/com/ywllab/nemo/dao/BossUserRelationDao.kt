package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.BossUserType
import com.ywllab.nemo.model.BossUserRelation
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object BossUserRelationDao : Table("nemo_boss_user_relation") {
    val userId = varchar("user_id", 32)
    val userType = enumerationByName<BossUserType>("user_type", 64)
    val createBy = varchar("create_by", 64)
    val createTime = long("create_time")

    override val primaryKey = PrimaryKey(userId)

    private val self = this

    val mapper = { row: ResultRow ->
        BossUserRelation().apply {
            userId = row[self.userId]
            userType = row[self.userType]
            createTime = row[self.createTime]
            createBy = row[self.createBy]
        }
    }

    fun getByUserId(userIdParam: String): BossUserRelation? {
        return transaction {
            select { self.userId eq userIdParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getAll(): List<BossUserRelation> {
        return transaction {
            self.join(UserDao, JoinType.INNER, self.userId, UserDao.userId)
                .select { Op.TRUE }
                .map { row: ResultRow ->
                    BossUserRelation().apply {
                        userId = row[self.userId]
                        userType = row[self.userType]
                        createTime = row[self.createTime]
                        createBy = row[self.createBy]
                        username = row[UserDao.username]
                        email = row[UserDao.email]
                    }
                }
        }
    }

    fun existsByUserId(userIdParam: String): Boolean {
        return transaction {
            select { self.userId eq userIdParam }
                .count() > 0
        }
    }

    fun create(bossUserRelation: BossUserRelation) {
        transaction {
            self.insert {
                it[userId] = bossUserRelation.userId
                it[userType] = bossUserRelation.userType
                it[createBy] = bossUserRelation.createBy
                it[createTime] = bossUserRelation.createTime
            }
        }
    }

    fun update(bossUserRelation: BossUserRelation) {
        transaction {
            update({ self.userId eq bossUserRelation.userId }) {
                it[userType] = bossUserRelation.userType
            }
        }
    }

    fun deleteByUserId(userIdParam: String) {
        transaction {
            deleteWhere { self.userId eq userIdParam }
        }
    }
}
