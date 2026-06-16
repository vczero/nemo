package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import cn.hutool.core.util.NumberUtil
import com.ywllab.nemo.dao.OrderDao
import com.ywllab.nemo.dao.PointsRecordDao
import com.ywllab.nemo.dao.ProductDao
import com.ywllab.nemo.dao.SubscriptionPlanDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.subscription.CalculateResult
import com.ywllab.nemo.dto.subscription.CreateSubscriptionPlanRequest
import com.ywllab.nemo.dto.subscription.SubscriptionOrderDto
import com.ywllab.nemo.dto.subscription.SubscriptionPlanDto
import com.ywllab.nemo.dto.subscription.SubscriptionPlanOptionDto
import com.ywllab.nemo.dto.subscription.UpdateSubscriptionPlanRequest
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.model.SubscriptionPlan
import com.ywllab.nemo.service.OrderService.Companion.POINTS_TO_AMOUNT_RATIO
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Year

@Service
open class SubscriptionPlanService {
    private val log = LoggerFactory.getLogger(SubscriptionPlanService::class.java)

    fun listPlans(): List<SubscriptionPlanOptionDto> {
        val plans = transaction {
            SubscriptionPlanDao.list(1, 10).first
        }.map {
            toUserDto(it)
        }
        return plans
    }

    fun calculateAmount(planId: String, subscribeMonth: Int): CalculateResult {
        val plan = SubscriptionPlanDao.getById(planId) ?: throw BizException("套餐不存在")

        val applicableRule = plan.pricingRules
            .filter { it.months == subscribeMonth }
            .maxByOrNull { it.months }

        val discount = applicableRule?.discount ?: 1.0
        val originalAmount = plan.monthlyPrice * subscribeMonth
        val discountedAmount = NumberUtil.round(originalAmount * discount, 0).toDouble()
        val discountAmount = originalAmount - discountedAmount
        val products = transaction {
            ProductDao.list(1, 1000, planId).first
        }

        // 最大可抵扣的积分数
        val maxDeductPoints = products
            .filter { it.isActive && it.pointsDeductEnabled }
            .sumOf { (it.maxPointsDeduct ?: 0) * subscribeMonth }
            .toLong()
        val account = UserAccountDao.getByUserId(getUserId()) ?: throw BizException("账户不存在")

        // 年度剩余可用的积分
        val currentYear = Year.now().value
        val annualUsed = PointsRecordDao.getAnnualDeductedPoints(account.accountId, currentYear)
        val annualRemaining = maxOf(0, UserAccountService.ANNUAL_POINTS_LIMIT - annualUsed)
        val maxPointsByAmount = (discountedAmount / POINTS_TO_AMOUNT_RATIO).toLong()
        val actualDeductPoints = if (maxDeductPoints > 0) {
            val availablePoints = account.pointsBalance.toLong()
            // 取产品上限、账户余额、年度剩余三者的最小值
            minOf(availablePoints, maxDeductPoints, maxPointsByAmount, annualRemaining.toLong())
        } else {
            0
        }.toInt()
        val amount = NumberUtil.round((originalAmount - discountAmount - actualDeductPoints), 0)
            .toDouble().coerceAtLeast(0.0)
        val result = CalculateResult().apply {
            this.originAmount = originalAmount
            this.monthlyPrice = plan.monthlyPrice
            this.subscribeMonth = subscribeMonth
            this.discount = discount
            this.pointsBalance = account.pointsBalance
            this.annualDeductedPoint = annualUsed
            this.deductPoint = actualDeductPoints
            this.pointDeductAmount = actualDeductPoints * POINTS_TO_AMOUNT_RATIO
            this.discountedAmount = discountedAmount
            this.discountAmount = discountAmount
            this.amount = amount
        }
        return result
    }

    open fun getMyPlanOrders(param: CommonPageQuery): PageResultDto<SubscriptionOrderDto> {
        val account = UserAccountDao.getByUserId(getUserId()) ?: return PageResultDto()

        val (planOrders, total) = OrderDao.getSubscriptionOrders(account.accountId, param)
        val dtos = planOrders.map { order ->
            SubscriptionOrderDto.from(order)
        }
        return PageResultDto(dtos, total, param.pageNum, param.pageSize)
    }

    open fun getActivePlans(): List<SubscriptionPlanDto> {
        val activePlan = transaction {
            SubscriptionPlanDao.getActivePlans().map { SubscriptionPlanDto(it) }
        }
        return activePlan
    }

    open fun list(pageNum: Int = 1, pageSize: Int = 20): PageResultDto<SubscriptionPlanDto> {
        val (plans, total) = SubscriptionPlanDao.list(pageNum, pageSize)
        val dtos = plans.map { SubscriptionPlanDto(it) }
        return PageResultDto(dtos, total, pageNum.toLong(), pageSize.toLong())
    }

    open fun getById(planId: String): SubscriptionPlanDto? {
        val plan = SubscriptionPlanDao.getById(planId) ?: return null
        return SubscriptionPlanDto(plan)
    }

    open fun create(request: CreateSubscriptionPlanRequest): SubscriptionPlanDto {
        val userId = getUserId()

        val existingPlan = SubscriptionPlanDao.getByCode(request.planCode)
        if (existingPlan != null) {
            throw BizException("套餐编码已存在")
        }

        val plan = SubscriptionPlan().apply {
            planId = IdUtil.getSnowflakeNextIdStr()
            planCode = request.planCode
            planName = request.planName
            planDescription = request.planDescription
            planType = request.planType
            monthlyPrice = request.monthlyPrice
            pricingRules = request.pricingRules
            features = request.features
            sortOrder = request.sortOrder
            isRecommended = request.isRecommended
            isActive = request.isActive
            createBy = userId
            createTime = System.currentTimeMillis()
            updateBy = userId
            updateTime = System.currentTimeMillis()
        }

        SubscriptionPlanDao.create(plan)
        log.info("SubscriptionPlan created, planId={}, planCode={}, userId={}", plan.planId, plan.planCode, userId)
        return SubscriptionPlanDto(plan)
    }

    open fun updatePlan(planId: String, request: UpdateSubscriptionPlanRequest): SubscriptionPlanDto {
        val userId = getUserId()
        val plan = SubscriptionPlanDao.getById(planId) ?: throw BizException("套餐不存在")

        plan.planName = request.planName
        plan.planDescription = request.planDescription
        plan.planType = request.planType
        plan.monthlyPrice = request.monthlyPrice
        plan.pricingRules = request.pricingRules
        plan.features = request.features
        plan.sortOrder = request.sortOrder
        plan.isRecommended = request.isRecommended
        plan.isActive = request.isActive
        plan.updateBy = userId
        plan.updateTime = System.currentTimeMillis()

        SubscriptionPlanDao.update(plan)
        log.info("SubscriptionPlan updated, planId={}, userId={}", planId, userId)
        return SubscriptionPlanDto(plan)
    }

    open fun setRecommendedPlan(planId: String): SubscriptionPlanDto {
        val userId = getUserId()
        val plan = SubscriptionPlanDao.getById(planId) ?: throw BizException("套餐不存在")

        SubscriptionPlanDao.setRecommended(planId, userId)
        plan.isRecommended = true
        plan.updateBy = userId
        plan.updateTime = System.currentTimeMillis()

        log.info("Recommended plan set, planId={}, userId={}", planId, userId)
        return SubscriptionPlanDto(plan)
    }

    private fun toUserDto(plan: SubscriptionPlan): SubscriptionPlanOptionDto {
        return SubscriptionPlanOptionDto().apply {
            this.planId = plan.planId
            this.planName = plan.planName
            this.planDescription = plan.planDescription
            this.planType = plan.planType
            this.pricingRules = plan.pricingRules
            this.features = plan.features
            this.sortOrder = plan.sortOrder
            this.isRecommended = booleanToBoolean(plan.isRecommended)
            this.isActive = booleanToBoolean(plan.isActive)
            this.monthlyPrice = plan.monthlyPrice
        }
    }

    private fun booleanToBoolean(value: Any?): Boolean {
        return when (value) {
            is Boolean -> value
            is Int -> value == 1
            else -> true
        }
    }
}
