package com.ywllab.nemo.dao

import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.model.UserAccount
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.minus
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object UserAccountDao : BaseDao<UserAccount>("nemo_user_account") {
    val accountId = varchar("account_id", 32)
    val userId = varchar("user_id", 32)
    val tokenBalance = long("token_balance")
    val tokenFrozen = long("token_frozen")
    val pointsBalance = integer("points_balance")
    val pointsUsed = integer("points_used")
    val currentPlanId = varchar("current_plan_id", 32).nullable()
    val subscriptionEndTime = long("subscription_end_time").nullable()
    val subscribeTokenBalance = long("subscribe_token_balance")
    val subscribeTokenQuota = long("subscribe_token_quota")
    override val primaryKey = PrimaryKey(accountId)

    private val self = this

    override fun createModel(): UserAccount {
        return UserAccount()
    }

    fun getByIds(ids: List<String>): List<UserAccount> {
        return transaction {
            select { self.accountId inList (ids) }
                .map(mapper)
        }
    }

    fun getById(idParam: String): UserAccount? {
        return transaction {
            select { self.accountId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByUserId(userIdParam: String): UserAccount? {
        return transaction {
            select { self.userId eq userIdParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun list(
        pageNum: Int = 1,
        pageSize: Int = 20
    ): Pair<List<UserAccount>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery) {
            Op.TRUE
        }
    }

    fun create(account: UserAccount) {
        transaction {
            self.insert {
                it[accountId] = account.accountId
                it[userId] = account.userId
                it[tokenBalance] = account.tokenBalance
                it[tokenFrozen] = account.tokenFrozen
                it[pointsBalance] = account.pointsBalance
                it[pointsUsed] = account.pointsUsed
                it[currentPlanId] = account.currentPlanId
                it[subscriptionEndTime] = account.subscriptionEndTime
                it[subscribeTokenBalance] = account.subscribeTokenBalance
                it[subscribeTokenQuota] = account.subscribeTokenQuota
                it[createBy] = account.createBy
                it[createTime] = account.createTime
                it[updateBy] = account.updateBy
                it[updateTime] = account.updateTime
            }
        }
    }

    fun update(account: UserAccount) {
        transaction {
            update({ accountId eq account.accountId }) {
                it[tokenBalance] = account.tokenBalance
                it[tokenFrozen] = account.tokenFrozen
                it[pointsBalance] = account.pointsBalance
                it[pointsUsed] = account.pointsUsed
                it[currentPlanId] = account.currentPlanId
                it[subscriptionEndTime] = account.subscriptionEndTime
                it[subscribeTokenBalance] = account.subscribeTokenBalance
                it[subscribeTokenQuota] = account.subscribeTokenQuota
                it[updateBy] = account.updateBy
                it[updateTime] = account.updateTime
            }
        }
    }

    /**
     * 原子增减积分余额，同时更新已使用积分
     * @return 更新后的余额，如果账户不存在返回null
     */
    fun addPointsBalance(accountIdParam: String, delta: Int, operator: String): Int? {
        val updated = update({ self.accountId eq accountIdParam }) {
            it[pointsBalance] = pointsBalance + delta
            // 如果是扣减积分，累加到已使用
            if (delta < 0) {
                it[pointsUsed] = pointsUsed + (-delta)
            }
            it[updateBy] = operator
            it[updateTime] = System.currentTimeMillis()
        }
        if (updated == 0) return null
        return select { self.accountId eq accountIdParam }
            .map { it[pointsBalance] }
            .firstOrNull()
    }

    fun updateTokenBalance(accountIdParam: String, newBalance: Long, newFrozen: Long, operator: String) {
        transaction {
            update({ self.accountId eq accountIdParam }) {
                it[tokenBalance] = newBalance
                it[tokenFrozen] = newFrozen
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun updateSubscription(accountIdParam: String, planId: String?, endTime: Long?, operator: String) {
        transaction {
            update({ self.accountId eq accountIdParam }) {
                it[currentPlanId] = planId
                it[subscriptionEndTime] = endTime
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    /**
     * 更新月度订阅token配额和余额
     * @param accountIdParam 账户ID
     * @param quota 每月配额（即月度token发放量）
     * @param operator 操作人
     */
    fun updateSubscribeToken(accountIdParam: String, quota: Long, operator: String) {
        transaction {
            update({ self.accountId eq accountIdParam }) {
                it[subscribeTokenQuota] = quota
                it[subscribeTokenBalance] = quota
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    /**
     * 重置月度订阅token余额（每月1号调用，将余额重置为配额）
     * @param accountIdParam 账户ID
     * @param operator 操作人
     */
    fun resetSubscribeTokenBalance(accountIdParam: String, operator: String) {
        transaction {
            update({ self.accountId eq accountIdParam }) {
                it[subscribeTokenBalance] = subscribeTokenQuota
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    /**
     * 获取所有有效订阅用户（subscriptionEndTime > now）
     */
    fun listActiveSubscriptionAccounts(): List<UserAccount> {
        val now = System.currentTimeMillis()
        return transaction {
            select { subscriptionEndTime greater now }
                .map(mapper)
        }
    }

    /**
     * 原子增加Token余额
     * @param accountIdParam 账户ID
     * @param delta Token增量（正数增加，负数减少）
     * @param operator 操作人
     * @return 更新后的余额，如果账户不存在返回null
     */
    fun addTokenBalance(accountIdParam: String, delta: Long, operator: String): Long? {
        val updated = update({ self.accountId eq accountIdParam }) {
            it[tokenBalance] = tokenBalance + delta
            it[updateBy] = operator
            it[updateTime] = System.currentTimeMillis()
        }
        if (updated == 0) return null
        return select { self.accountId eq accountIdParam }
            .map { it[tokenBalance] }
            .firstOrNull()
    }

    /**
     * 原子扣减Token余额
     * @param accountIdParam 账户ID
     * @param amount 扣减数量（正数）
     * @return 更新后的余额，如果账户不存在或余额不足返回null
     */
    fun deductTokenBalance(accountIdParam: String, amount: Long): Long? {
        if (amount <= 0) return null

        val account = getById(accountIdParam) ?: return null
        if (account.tokenBalance < amount) {
            // 余额不足，但仍然扣减到0
            transaction {
                update({ self.accountId eq accountIdParam }) {
                    it[tokenBalance] = 0
                    it[updateTime] = System.currentTimeMillis()
                }
            }
            return 0L
        }

        transaction {
            update({ self.accountId eq accountIdParam }) {
                it[tokenBalance] = tokenBalance - amount
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return account.tokenBalance - amount
    }

    /**
     * 原子扣减月度订阅token余额
     * @param accountIdParam 账户ID
     * @param amount 扣减数量（正数）
     * @return 实际扣减数量
     */
    fun deductSubscribeTokenBalance(accountIdParam: String, amount: Long): Long {
        if (amount <= 0) return 0L

        val account = getById(accountIdParam) ?: return 0L
        val deductAmount = minOf(account.subscribeTokenBalance, amount)

        transaction {
            update({ self.accountId eq accountIdParam }) {
                it[subscribeTokenBalance] = subscribeTokenBalance - deductAmount
                it[updateTime] = System.currentTimeMillis()
            }
        }
        return deductAmount
    }
}
