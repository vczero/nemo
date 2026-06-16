package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.OrderSource
import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.constant.ProductType
import com.ywllab.nemo.constant.TokenPackStatus
import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.dto.subscription.OrderQuery
import com.ywllab.nemo.model.Order
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.case
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.jetbrains.exposed.sql.SqlExpressionBuilder.minus
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.longLiteral
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object OrderDao : BaseDao<Order>("nemo_order") {
    val orderId = varchar("order_id", 32)
    val orderNo = varchar("order_no", 64)
    val accountId = varchar("account_id", 32)
    val productId = varchar("product_id", 32)
    val subscriptionPlanId = varchar("subscription_plan_id", 32).nullable()
    val productSnapshot = varchar("product_snapshot", 4096)
    val quantity = integer("quantity")
    val originalAmount = double("original_amount")
    val discountAmount = double("discount_amount")
    val pointsDeductAmount = double("points_deduct_amount")
    val pointsUsed = integer("points_used")
    val payAmount = double("pay_amount")
    val status = enumerationByName<OrderStatus>("status", 32)
    val payMethod = enumerationByName<PayMethod>("pay_method", 32).nullable()
    val paidTime = long("paid_time").nullable()
    val expireTime = long("expire_time")
    val remark = varchar("remark", 256).nullable()
    val orderSource = enumerationByName<OrderSource>("source", 190)

    // 流量包产品套餐信息
    val tokenRemainingAmount = long("token_remaining_amount")
    val tokenPackStatus = enumerationByName<TokenPackStatus>("token_pack_status", 16).nullable()

    override val primaryKey = PrimaryKey(orderId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(self.tokenPackStatus)).also {
            it.tokenPackStatus = row[self.tokenPackStatus]
        }
    }

    override fun createModel(): Order {
        return Order()
    }

    fun getById(idParam: String): Order? {
        return transaction {
            select { self.orderId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByOrderNo(orderNoParam: String, amount: Double): Order? {
        return transaction {
            select { (self.orderNo eq orderNoParam).and(self.payAmount.eq(amount)) }
                .forUpdate()
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getStatus(idParam: String): OrderStatus? {
        return transaction {
            slice(self.status)
                .select { self.orderId eq idParam }
                .map { it[self.status] }
                .firstOrNull()
        }
    }

    fun getByAccountId(accountIdParam: String, pageNum: Int = 1, pageSize: Int = 20): Pair<List<Order>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery) {
            self.accountId eq accountIdParam
        }
    }

    fun getByPlanId(planIdParam: String, pageNum: Int = 1, pageSize: Int = 20): Pair<List<Order>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery) {
            self.subscriptionPlanId eq planIdParam
        }
    }

    fun getByProductId(productIdParam: String, pageNum: Int = 1, pageSize: Int = 20): Pair<List<Order>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery) {
            self.productId eq productIdParam
        }
    }

    fun create(order: Order) {
        transaction {
            self.insert {
                it[orderId] = order.orderId
                it[orderNo] = order.orderNo
                it[accountId] = order.accountId
                it[productId] = order.productId
                it[subscriptionPlanId] = order.subscriptionPlanId
                it[productSnapshot] = order.productSnapshot
                it[quantity] = order.quantity
                it[originalAmount] = order.originalAmount
                it[discountAmount] = order.discountAmount
                it[pointsDeductAmount] = order.pointsDeductAmount
                it[pointsUsed] = order.pointsUsed
                it[payAmount] = order.payAmount
                it[status] = order.status
                it[payMethod] = order.payMethod
                it[paidTime] = order.paidTime
                it[expireTime] = order.expireTime
                it[remark] = order.remark
                it[orderSource] = order.source
                it[tokenRemainingAmount] = order.tokenRemainingAmount
                it[tokenPackStatus] = order.tokenPackStatus
                it[createBy] = order.createBy
                it[createTime] = System.currentTimeMillis()
                it[updateBy] = order.updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun update(order: Order) {
        transaction {
            update({
                self.orderId.eq(order.orderId)
                    .and(self.status.eq(OrderStatus.UN_PAY))
            }) {
                it[status] = order.status
                it[payMethod] = order.payMethod
                it[paidTime] = order.paidTime
                it[tokenRemainingAmount] = order.tokenRemainingAmount
                it[tokenPackStatus] = order.tokenPackStatus
                it[expireTime] = order.expireTime
                it[updateBy] = order.updateBy
                it[updateTime] = order.updateTime
            }
        }
    }

    /**
     * 更新流量包剩余数量（原子操作）
     */
    fun updateTokenRemainingAmount(orderId: String, deductAmount: Long, newStatus: TokenPackStatus? = null) {
        return transaction {
            update({ self.orderId eq orderId }) {
                it[tokenRemainingAmount] = case().When(
                    (tokenRemainingAmount - deductAmount).lessEq(longLiteral(0)),
                    longLiteral(0)
                ).Else(tokenRemainingAmount - deductAmount)
                if (newStatus != null) {
                    it[tokenPackStatus] = newStatus
                }
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    /**
     * 管理员查询订单列表
     */
    fun list(query: OrderQuery): Pair<List<Order>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = query.pageNum
            this.pageSize = query.pageSize
        }
        return page(pageQuery) {
            buildQueryCondition(query)
        }
    }

    private fun buildQueryCondition(query: OrderQuery): Op<Boolean> {
        var condition: Op<Boolean> = Op.TRUE

        // 关键词搜索（订单号）
        val keyword = query.keyword
        if (keyword.isNotBlank()) {
            condition = condition and (this.orderNo like "%$keyword%")
        }

        // 状态筛选
        val status = query.status
        if (status != null) {
            condition = condition and (this.status eq status)
        }

        // 用户ID筛选
        val userId = query.userId
        if (!userId.isNullOrBlank()) {
            condition = condition and (this.accountId eq userId)
        }

        // 产品ID筛选
        val productId = query.productId
        if (!productId.isNullOrBlank()) {
            condition = condition and (this.productId eq productId)
        }

        // 套餐ID筛选
        val planId = query.planId
        if (!planId.isNullOrBlank()) {
            condition = condition and (this.subscriptionPlanId eq planId)
        }

        // 时间范围筛选
        val startTime = query.startTime
        if (startTime != null) {
            condition = condition and (this.createTime greaterEq startTime)
        }
        val endTime = query.endTime
        if (endTime != null) {
            condition = condition and (this.createTime lessEq endTime)
        }

        return condition
    }

    /**
     * 管理员统计订单数量
     */
    fun count(query: OrderQuery): Long {
        return transaction {
            val condition = buildQueryCondition(query)
            select { condition }.count()
        }
    }

    /**
     * 查询可用流量包订单（按过期时间升序）
     */
    fun getActiveTokenPackOrders(accountIdParam: String): Order? {
        // 查询流量包产品
        val productIds = ProductDao.listProductByProductType(ProductType.TOKEN_PACK)
        return transaction {
            select {
                (self.accountId eq accountIdParam)
                    .and(self.tokenPackStatus eq TokenPackStatus.ACTIVE)
                    .and(self.productId inList productIds)
            }
                .orderBy(self.expireTime, SortOrder.ASC)
                .limit(1)
                .map(mapper).firstOrNull()
        }
    }

    /**
     * 查询用户流量包订单列表
     */
    fun getTokenPackOrders(
        accountIdParam: String,
        param: CommonPageQuery,
    ): Pair<List<Order>, Long> {
        // 查询流量包产品
        val productIds = ProductDao.listProductByProductType(ProductType.TOKEN_PACK)
        return page(param, self.createTime, SortOrder.DESC) {
            (self.accountId eq accountIdParam)
                .and(self.productId inList productIds)
                .and(self.tokenPackStatus.isNotNull())
        }
    }

    /**
     * 查询订阅套餐订单列表
     */
    fun getSubscriptionOrders(
        accountIdParam: String,
        param: CommonPageQuery,
    ): Pair<List<Order>, Long> {
        val planIds = ProductDao.listPlanByProductType(ProductType.SUBSCRIPTION)
        return page(param, self.createTime, SortOrder.DESC) {
            (self.accountId eq accountIdParam)
                .and(self.subscriptionPlanId inList planIds)
                .and(self.status eq OrderStatus.PAID)
        }
    }

    /**
     * 批量更新过期流量包状态
     */
    fun updateExpiredTokenPacks(): Int {
        return transaction {
            update({
                (self.tokenPackStatus eq TokenPackStatus.ACTIVE) and
                    (self.expireTime lessEq System.currentTimeMillis())
            }) {
                it[tokenPackStatus] = TokenPackStatus.EXPIRED
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }
}
