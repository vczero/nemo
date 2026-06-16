package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.PointsRecordType
import com.ywllab.nemo.constant.SubscriptionPlanType
import com.ywllab.nemo.constant.SubscriptionStatus
import com.ywllab.nemo.dao.PointsRecordDao
import com.ywllab.nemo.dao.SubscriptionPlanDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dto.account.AccountInfoResponse
import com.ywllab.nemo.dto.account.BossPointsStatisticsResponse
import com.ywllab.nemo.dto.account.PointsRecordPageRequest
import com.ywllab.nemo.dto.account.PointsRecordResponse
import com.ywllab.nemo.dto.account.UserSubscriptionPlanDto
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.SystemException
import com.ywllab.nemo.model.PointsRecord
import com.ywllab.nemo.model.SubscriptionPlan
import com.ywllab.nemo.model.UserAccount
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.Year
import java.time.ZoneId

@Service
open class UserAccountService {
    private val log = LoggerFactory.getLogger(UserAccountService::class.java)

    companion object {
        // 邀请奖励积分
        const val INVITER_REWARD_POINTS = 5

        // 被邀请奖励积分
        const val INVITED_REWARD_POINTS = 2

        const val PLAN_CODE_FREE = "FREE"

        // 年度积分抵扣限制
        const val ANNUAL_POINTS_LIMIT = 120
    }

    @Autowired
    private lateinit var invitationService: InvitationService

    /**
     * 创建用户账户（用户注册时调用）
     */
    open fun createAccount(userId: String, operator: String): UserAccount {
        val now = System.currentTimeMillis()
        val account = UserAccount().apply {
            this.accountId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            this.tokenBalance = 0L
            this.tokenFrozen = 0L
            this.pointsBalance = 0
            this.currentPlanId = null
            this.subscriptionEndTime = null
            this.createBy = operator
            this.createTime = now
            this.updateBy = operator
            this.updateTime = now
        }

        UserAccountDao.create(account)
        log.info("Created user account, accountId={}, userId={}", account.accountId, userId)
        return account
    }

    /**
     * 获取用户账户信息
     */
    open fun getAccountByUserId(userId: String): UserAccount? {
        return UserAccountDao.getByUserId(userId)
    }

    /**
     * 获取账户详情响应
     */
    open fun getAccountInfo(userId: String): AccountInfoResponse? {
        val account = UserAccountDao.getByUserId(userId) ?: return null

        val now = System.currentTimeMillis()
        val subscriptionStatus = when {
            account.currentPlanId == null -> SubscriptionStatus.NONE
            account.subscriptionEndTime == null -> SubscriptionStatus.ACTIVE
            account.subscriptionEndTime!! > now -> SubscriptionStatus.ACTIVE
            else -> SubscriptionStatus.EXPIRED
        }

        return AccountInfoResponse().apply {
            this.accountId = account.accountId
            this.userId = account.userId
            this.tokenBalance = account.tokenBalance
            this.tokenFrozen = account.tokenFrozen
            this.pointsBalance = account.pointsBalance
            this.currentPlanId = account.currentPlanId
            this.subscriptionEndTime = account.subscriptionEndTime
            this.subscriptionStatus = subscriptionStatus
        }
    }

    /**
     * 获取用户当前订阅套餐信息
     */
    open fun getActivePlan(userId: String): UserSubscriptionPlanDto? {
        val account = UserAccountDao.getByUserId(userId) ?: return null

        var plan: SubscriptionPlan? = null
        if (account.currentPlanId != null) {
            plan = SubscriptionPlanDao.getById(account.currentPlanId!!)
        }
        if (plan == null) {
            // 查询 FREE 免费套餐作为默认套餐
            plan = SubscriptionPlanDao.getByCode(PLAN_CODE_FREE)
        }
        if (plan == null) {
            throw SystemException("需要先初始化套餐配置")
        }
        val subscriptionStatus = if (account.currentPlanId != null
        ) {
            if ((account.subscriptionEndTime ?: 0L) > System.currentTimeMillis()) {
                SubscriptionStatus.ACTIVE
            } else {
                SubscriptionStatus.EXPIRED
            }
        } else {
            SubscriptionStatus.ACTIVE
        }
        val planType = plan.planType ?: SubscriptionPlanType.FREE
        return UserSubscriptionPlanDto().apply {
            this.planId = plan.planId
            this.planName = plan.planName
            this.planDescription = plan.planDescription ?: ""
            this.planType = planType
            this.features = plan.features
            this.subscriptionEndTime = account.subscriptionEndTime
            this.subscriptionStatus = subscriptionStatus
        }
    }

    /**
     * 邀请奖励积分（邀请人+5，被邀请人+2）
     */
    open fun rewardInvitePoints(inviterId: String, inviteeId: String, operator: String) {
        transaction {
            // 邀请人获得5积分
            val inviterAccount = UserAccountDao.getByUserId(inviterId)
            if (inviterAccount != null) {
                addPoints(
                    accountId = inviterAccount.accountId,
                    points = INVITER_REWARD_POINTS,
                    type = PointsRecordType.INVITE_REWARD,
                    bizId = inviteeId,
                    bizType = "USER",
                    remark = "邀请用户注册奖励",
                    operator = operator
                )
                log.info("Invite reward points added, inviterId={}, points={}", inviterId, INVITER_REWARD_POINTS)
            }

            // 被邀请人获得2积分
            val inviteeAccount = UserAccountDao.getByUserId(inviteeId)
            if (inviteeAccount != null) {
                addPoints(
                    accountId = inviteeAccount.accountId,
                    points = INVITED_REWARD_POINTS,
                    type = PointsRecordType.INVITED_REWARD,
                    bizId = inviterId,
                    bizType = "USER",
                    remark = "受邀注册奖励",
                    operator = operator
                )
                log.info("Invited reward points added, inviteeId={}, points={}", inviteeId, INVITED_REWARD_POINTS)
            }
        }
    }

    /**
     * 增加/减少积分（使用原子操作，并发安全）
     */
    private fun addPoints(
        accountId: String,
        points: Int,
        type: PointsRecordType,
        bizId: String? = null,
        bizType: String? = null,
        remark: String? = null,
        operator: String
    ) {
        if (points == 0) return

        transaction {
            // 原子更新余额，返回更新后的值
            val balanceAfter = UserAccountDao.addPointsBalance(accountId, points, operator)
                ?: throw IllegalArgumentException("Account not found: $accountId")

            // 根据更新后的余额反推更新前的余额
            val balanceBefore = balanceAfter - points

            // 记录积分流水
            val now = System.currentTimeMillis()
            val record = PointsRecord().apply {
                this.recordId = IdUtil.getSnowflakeNextIdStr()
                this.accountId = accountId
                this.points = points
                this.balanceBefore = balanceBefore
                this.balanceAfter = balanceAfter
                this.type = type
                this.bizId = bizId
                this.bizType = bizType
                this.remark = remark
                this.createBy = operator
                this.createTime = now
                this.updateBy = operator
                this.updateTime = now
            }
            PointsRecordDao.create(record)

            log.info(
                "积分变化, accountId={}, points={}, type={}, balanceAfter={}",
                accountId, points, type.name, balanceAfter
            )
        }
    }

    /**
     * 扣减积分（用于订单抵扣）
     */
    open fun deductPoints(
        accountId: String,
        points: Int,
        bizId: String,
        bizType: String,
        remark: String?,
        operator: String
    ): Boolean {
        if (points <= 0) return false
        val account = UserAccountDao.get(accountId)
            ?: throw IllegalArgumentException("Account not found: $accountId")
        if (account.pointsBalance < points) {
            throw BizException(
                "积分不足, accountId=$accountId, required=$points, " +
                    "balance=${account.pointsBalance}"
            )
        }

        // 检查年度限制
        val currentYear = Year.now().value
        val annualUsed = PointsRecordDao.getAnnualDeductedPoints(accountId, currentYear)
        if (annualUsed + points > ANNUAL_POINTS_LIMIT) {
            throw BizException(
                "年度积分额度不足, accountId=$accountId, required=$points, annualUsed=$annualUsed," +
                    " limit=$ANNUAL_POINTS_LIMIT"
            )
        }
        return transaction {
            addPoints(
                accountId = accountId,
                points = -points,
                type = PointsRecordType.ORDER_DEDUCT,
                bizId = bizId,
                bizType = bizType,
                remark = remark,
                operator = operator
            )
            true
        }
    }

    /**
     * 管理员调整积分
     */
    open fun adjustPoints(accountId: String, points: Int, remark: String?, operator: String) {
        addPoints(
            accountId = accountId,
            points = points,
            type = PointsRecordType.ADMIN_ADJUST,
            remark = remark ?: "系统赠送",
            operator = operator
        )
    }

    /**
     * 查询积分记录
     */
    open fun listPointsRecords(
        accountId: String,
        request: PointsRecordPageRequest
    ): Pair<List<PointsRecordResponse>, Long> {
        val (records, total) = PointsRecordDao.listByAccountId(
            accountIdParam = accountId,
            typeParam = request.type,
            pageNum = request.pageNum.toInt(),
            pageSize = request.pageSize.toInt()
        )

        val responses = records.map { record ->
            PointsRecordResponse().apply {
                this.recordId = record.recordId
                this.points = record.points
                this.type = record.type
                this.typeName = record.type.desc
                this.balanceAfter = record.balanceAfter
                this.remark = record.remark
                this.createTime = record.createTime
            }
        }

        return Pair(responses, total)
    }

    /**
     * 获取用户积分统计（直接从账户表读取，O(1)复杂度）
     */
    open fun getPointsStatistics(userId: String): BossPointsStatisticsResponse {
        val account = UserAccountDao.getByUserId(userId)
            ?: return BossPointsStatisticsResponse()

        val annualUsed = PointsRecordDao.getAnnualDeductedPoints(account.accountId, Year.now().value)

        return BossPointsStatisticsResponse().apply {
            this.balance = account.pointsBalance
            this.totalEarned = account.pointsBalance + account.pointsUsed
            this.totalUsed = account.pointsUsed
            this.annualUsed = annualUsed
        }
    }

    /**
     * 获取用户积分消费明细（支持时间范围筛选）
     */
    open fun getUserPointsRecordsDetailed(
        userId: String,
        type: PointsRecordType?,
        startDate: String?,
        endDate: String?,
        pageNum: Int,
        pageSize: Int
    ): Pair<List<PointsRecordResponse>, Long> {
        val account = UserAccountDao.getByUserId(userId)
            ?: throw IllegalArgumentException("用户账户不存在")

        val user = UserDao.getById(userId)
            ?: throw IllegalArgumentException("用户不存在")

        val request = PointsRecordPageRequest().apply {
            this.type = type
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }

        val (list, total) = listPointsRecords(account.accountId, request)

        val filteredList = if (!startDate.isNullOrBlank() || !endDate.isNullOrBlank()) {
            val startTime = if (!startDate.isNullOrBlank()) {
                LocalDate.parse(startDate).atStartOfDay(ZoneId.systemDefault()).toEpochSecond() * 1000
            } else {
                0L
            }

            val endTime = if (!endDate.isNullOrBlank()) {
                LocalDate.parse(endDate).plusDays(1).atStartOfDay(ZoneId.systemDefault()).toEpochSecond() * 1000
            } else {
                System.currentTimeMillis()
            }

            list.filter { record ->
                record.createTime in startTime..endTime
            }
        } else {
            list
        }

        return Pair(filteredList, total)
    }
}
