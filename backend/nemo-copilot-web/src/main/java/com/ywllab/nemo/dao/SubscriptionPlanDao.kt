package com.ywllab.nemo.dao

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.constant.SubscriptionFeature
import com.ywllab.nemo.constant.SubscriptionPlanType
import com.ywllab.nemo.model.PricingRule
import com.ywllab.nemo.model.SubscriptionPlan
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object SubscriptionPlanDao : BaseDao<SubscriptionPlan>("nemo_subscription_plan") {
    val planId = varchar("plan_id", 32)
    val planCode = varchar("plan_code", 32)
    val planName = varchar("plan_name", 64)
    val planDescription = varchar("plan_description", 512).nullable()
    val planType = enumerationByName<SubscriptionPlanType>("plan_type", 32).nullable()
    val monthlyPrice = decimal("monthly_price", 12, 2)
    val pricingRules = text("pricing_rules").nullable()
    val features = text("features").nullable()
    val sortOrder = integer("sort_order")
    val isRecommended = bool("is_recommended")
    val isActive = bool("is_active")

    override val primaryKey = PrimaryKey(planId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(self.features, self.pricingRules)).also {
            row[self.features]?.let { features ->
                it.features = JSONUtil.parseArray(features).map { feature ->
                    SubscriptionFeature.valueOf(feature.toString())
                }
            }
            row[self.pricingRules]?.let { rules ->
                it.pricingRules = JSONUtil.parseArray(rules).map { rule ->
                    JSONUtil.toBean(JSONUtil.toJsonStr(rule), PricingRule::class.java)
                }
            }
        }
    }

    override fun createModel(): SubscriptionPlan {
        return SubscriptionPlan()
    }

    fun getById(idParam: String): SubscriptionPlan? {
        return transaction {
            select { self.planId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByCode(codeParam: String): SubscriptionPlan? {
        return transaction {
            select { self.planCode eq codeParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getActivePlans(): List<SubscriptionPlan> {
        return transaction {
            select { self.isActive eq true }
                .orderBy(sortOrder)
                .map(mapper)
        }
    }

    fun list(
        pageNum: Int = 1,
        pageSize: Int = 20
    ): Pair<List<SubscriptionPlan>, Long> {
        val pageQuery = com.ywllab.nemo.dto.PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery, self.sortOrder, SortOrder.ASC) {
            Op.TRUE
        }
    }

    fun create(plan: SubscriptionPlan) {
        transaction {
            self.insert {
                it[planId] = plan.planId
                it[planCode] = plan.planCode
                it[planName] = plan.planName
                it[planDescription] = plan.planDescription
                it[planType] = plan.planType
                it[monthlyPrice] = plan.monthlyPrice.toBigDecimal()
                it[pricingRules] = JSONUtil.toJsonStr(plan.pricingRules)
                it[features] = JSONUtil.toJsonStr(plan.features)
                it[sortOrder] = plan.sortOrder
                it[isRecommended] = plan.isRecommended
                it[isActive] = plan.isActive
                it[createBy] = plan.createBy
                it[createTime] = plan.createTime
                it[updateBy] = plan.updateBy
                it[updateTime] = plan.updateTime
            }
        }
    }

    fun update(plan: SubscriptionPlan) {
        transaction {
            update({ planId eq plan.planId }) {
                it[planName] = plan.planName
                it[planDescription] = plan.planDescription
                it[planType] = plan.planType
                it[monthlyPrice] = plan.monthlyPrice.toBigDecimal()
                it[pricingRules] = JSONUtil.toJsonStr(plan.pricingRules)
                it[features] = JSONUtil.toJsonStr(plan.features)
                it[sortOrder] = plan.sortOrder
                it[isRecommended] = plan.isRecommended
                it[isActive] = plan.isActive
                it[updateBy] = plan.updateBy
                it[updateTime] = plan.updateTime
            }
        }
    }

    fun setRecommended(planIdParam: String, operator: String) {
        transaction {
            update({ self.planId eq planIdParam }) {
                it[isRecommended] = true
                it[updateBy] = operator
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }
}
