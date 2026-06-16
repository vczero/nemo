package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.SubscriptionStatus
import com.ywllab.nemo.model.UserSubscription
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

@Deprecated("UserAccount表获取plan的结束时间")
object UserSubscriptionDao : BaseDao<UserSubscription>("nemo_user_subscription") {
    val subscriptionId = varchar("subscription_id", 32)
    val accountId = varchar("account_id", 32)
    val planId = varchar("plan_id", 32)
    val startTime = long("start_time")
    val endTime = long("end_time").nullable()
    val status = enumerationByName<SubscriptionStatus>("status", 32)

    override val primaryKey = PrimaryKey(subscriptionId)

    private val self = this

    override fun createModel(): UserSubscription {
        return UserSubscription()
    }

    fun getById(idParam: String): UserSubscription? {
        return transaction {
            select { self.subscriptionId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByAccountId(accountIdParam: String): List<UserSubscription> {
        return transaction {
            select { self.accountId eq accountIdParam }
                .map(mapper)
        }
    }

    fun create(subscription: UserSubscription) {
        transaction {
            self.insert {
                it[subscriptionId] = subscription.subscriptionId
                it[accountId] = subscription.accountId
                it[planId] = subscription.planId
                it[startTime] = subscription.startTime
                it[endTime] = subscription.endTime
                it[status] = subscription.status
                it[createBy] = subscription.createBy
                it[createTime] = subscription.createTime
                it[updateBy] = subscription.updateBy
                it[updateTime] = subscription.updateTime
            }
        }
    }
}
