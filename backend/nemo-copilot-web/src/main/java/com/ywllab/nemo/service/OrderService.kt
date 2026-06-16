package com.ywllab.nemo.service

import cn.hutool.core.date.DateUtil
import cn.hutool.core.util.IdUtil
import cn.hutool.core.util.StrUtil
import cn.hutool.json.JSONUtil
import com.ywllab.nemo.constant.OrderSource
import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.constant.ProductType
import com.ywllab.nemo.dao.OrderDao
import com.ywllab.nemo.dao.ProductDao
import com.ywllab.nemo.dao.SubscriptionPlanDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.payment.AlipayOrderBizModel
import com.ywllab.nemo.dto.subscription.CreateOrderRequest
import com.ywllab.nemo.dto.subscription.OrderDetailDto
import com.ywllab.nemo.dto.subscription.OrderDto
import com.ywllab.nemo.dto.subscription.OrderQuery
import com.ywllab.nemo.dto.subscription.OrderSnapshot
import com.ywllab.nemo.dto.subscription.PayOrderRequest
import com.ywllab.nemo.dto.subscription.PayOrderResponse
import com.ywllab.nemo.dto.subscription.boss.OrderUserDto
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.OrderNotFound
import com.ywllab.nemo.model.Order
import com.ywllab.nemo.model.Product
import com.ywllab.nemo.model.SubscriptionPlan
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.util.Date

@Service
open class OrderService {
    val logger = LoggerFactory.getLogger(javaClass)
    private val ORDER_EXPIRE_MINUTES = 30L

    companion object {
        // 积分换算比例：1积分 = X元
        const val POINTS_TO_AMOUNT_RATIO = 1.0
    }

    @Autowired
    private lateinit var subscriptionPlanService: SubscriptionPlanService

    @Autowired
    private lateinit var alipayService: AlipayService

    @Autowired
    private lateinit var userAccountService: UserAccountService

    @Autowired
    private lateinit var userService: UserService

    @Autowired
    private lateinit var tokenPackService: TokenPackService

    open fun createOrder(request: CreateOrderRequest): PayOrderResponse {
        val userId = UserSessionHelper.getUserId()
        val account = UserAccountDao.getByUserId(userId) ?: throw BizException("账户不存在")

        var originAmount = 0.0
        var discountAmount = 0.0
        var pointsDeductAmount = 0.0
        var pointsUsed = 0
        var product: Product? = null
        var plan: SubscriptionPlan? = null
        var subscribeMonth: Int? = null

        // 单产品订单
        if (StrUtil.isNotBlank(request.productId)) {
            product = ProductDao.getById(request.productId) ?: throw BizException("产品不存在")
            if (!product.isActive) {
                throw BizException("产品已下架")
            }
            originAmount = product.currentPrice

            if (product.pointsDeductEnabled) {
                var maxDeductAmount = account.pointsBalance.toDouble() * POINTS_TO_AMOUNT_RATIO

                if (product.maxPointsDeduct != null) {
                    val productMaxDeductAmount = product.maxPointsDeduct!!.toDouble() * POINTS_TO_AMOUNT_RATIO
                    if (maxDeductAmount > productMaxDeductAmount) {
                        maxDeductAmount = productMaxDeductAmount
                    }
                }

                if (maxDeductAmount > originAmount) {
                    maxDeductAmount = originAmount
                }

                pointsDeductAmount = maxDeductAmount
                pointsUsed = (pointsDeductAmount / POINTS_TO_AMOUNT_RATIO).toInt()
            }
        }
        // 套餐订单
        if (StrUtil.isNotBlank(request.planId)) {
            plan = SubscriptionPlanDao.getById(request.planId) ?: throw BizException("套餐不存在")
            if (!plan.isActive) {
                throw BizException("套餐已下架")
            }
            subscribeMonth = request.subscribeMonth ?: throw BizException("订阅月数不能为空")
            val calculateResult = subscriptionPlanService.calculateAmount(request.planId, subscribeMonth)
            originAmount = calculateResult.originAmount
            discountAmount = calculateResult.discountAmount
            pointsDeductAmount = calculateResult.pointDeductAmount
            pointsUsed = calculateResult.deductPoint
        }

        if (originAmount <= 0) {
            throw BizException("订单金额异常")
        }

        val payAmount = originAmount - discountAmount - pointsDeductAmount
        val order = Order().apply {
            orderId = IdUtil.getSnowflakeNextIdStr()
            orderNo = generateOrderNo(product, plan)
            accountId = account.accountId
            productId = product?.productId ?: ""
            subscriptionPlanId = plan?.planId ?: ""
            quantity = request.subscribeMonth ?: 1
            productSnapshot = toOrderSnapshot(product, plan, subscribeMonth)
            this.originalAmount = originAmount
            this.discountAmount = discountAmount
            this.pointsDeductAmount = pointsDeductAmount
            this.pointsUsed = pointsUsed
            this.payAmount = payAmount
            status = OrderStatus.UN_PAY
            source = OrderSource.TO_C
            expireTime = System.currentTimeMillis() + ORDER_EXPIRE_MINUTES * 60 * 1000
            remark = request.remark
            createBy = userId
            createTime = System.currentTimeMillis()
            updateBy = userId
            updateTime = System.currentTimeMillis()
        }

        OrderDao.create(order)
        logger.info("Order created, orderId={}, orderNo={}, userId={}", order.orderId, order.orderNo, userId)

        // 如果支付金额为0，无需创建支付宝订单，直接完成支付
        if (payAmount.toInt() == 0 && pointsDeductAmount > 0) {
            logger.info(
                "订单因积分抵扣无需支付, orderId=${order.orderId},  userId=$userId, " +
                    "payAmount=$payAmount, pointsDeductAmount=$pointsDeductAmount,"
            )
            doFinishOrder(order, PayMethod.INTERNAL_POINT)
            return PayOrderResponse.from(order.orderId, PayMethod.INTERNAL_POINT)
        } else {
            val payParam = PayOrderRequest().apply {
                payMethod = request.payMethod
                payQrCodeWidth = request.payQrCodeWidth
            }
            // 生成订单时，同时生成支付二维码URL
            return payOrder(order.orderId, payParam)
        }
    }

    fun payOrder(orderId: String, payOrderRequest: PayOrderRequest): PayOrderResponse {
        val order = OrderDao.getById(orderId) ?: throw BizException("订单不存在")
        val config = alipayService.getConfig()
        if (!config.enabled) {
            throw BizException("支付宝支付未配置")
        }
        val snapshot = if (order.productSnapshot.isNotBlank()) {
            try {
                JSONUtil.toBean(order.productSnapshot, OrderSnapshot::class.java)
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }

        val productInfo = snapshot?.product
        val planInfo = snapshot?.plan

        val subject = if (productInfo?.productName != null) {
            productInfo.productName
        } else if (planInfo?.planName != null) {
            "${planInfo.planName}(${planInfo.subscribeMonth}个月)"
        } else {
            "订单支付-${order.orderNo}"
        }

        val body = if (productInfo != null) {
            "产品：${productInfo.productName}"
        } else if (planInfo != null) {
            "套餐：${planInfo.planName}"
        } else {
            "订单支付"
        }

        val request = AlipayOrderBizModel().apply {
            outTradeNo = order.orderNo
            totalAmount = order.payAmount
            this.subject = subject
            this.body = body
            this.timeoutExpress = "30m"
            this.productCode = "FAST_INSTANT_TRADE_PAY"
        }

        val payFormHtml = alipayService.createPaymentOrder(request, payOrderRequest.payQrCodeWidth)
        return PayOrderResponse.from(orderId, payOrderRequest.payMethod, payFormHtml)
    }

    fun getOrderStatus(orderId: String): OrderStatus? {
        return OrderDao.getStatus(orderId)
    }

    /**
     * 管理员查询订单详情
     */
    open fun getOrderDetailForAdmin(orderId: String): OrderDetailDto? {
        val order = OrderDao.getById(orderId) ?: return null

        val product = ProductDao.getById(order.productId)
        val subscriptionPlan = order.subscriptionPlanId?.let { SubscriptionPlanDao.getById(it) }
        val dto = OrderDetailDto.from(order, product, subscriptionPlan)

        val account = UserAccountDao.getById(order.accountId)
        if (account != null) {
            val user = UserDao.getById(account.userId)
            if (user != null) {
                dto.user = OrderUserDto.from(user)
            }
        }

        return dto
    }

    open fun toOrderSnapshot(product: Product?, plan: SubscriptionPlan?, subscribeMonth: Int? = null): String {
        val snapshot = if (product != null) {
            OrderSnapshot(product)
        } else {
            val planProducts = ProductDao.list(1, 1000, plan!!.planId).first
            OrderSnapshot(plan, subscribeMonth!!, planProducts)
        }
        return JSONUtil.toJsonStr(snapshot)
    }

    open fun finishOrder(orderNo: String, payAmount: Double, payMethod: PayMethod): PayOrderResponse {
        // 订单状态异常
        val order = OrderDao.getByOrderNo(orderNo, payAmount) ?: throw OrderNotFound(orderNo)
        return doFinishOrder(order, payMethod)
    }

    /**
     * 管理员标记订单为已支付（调试用）
     */
    open fun finishOrderByAdmin(orderId: String): PayOrderResponse {
        val order = OrderDao.getById(orderId) ?: throw BizException("订单不存在")
        return doFinishOrder(order, PayMethod.WECHAT)
    }

    fun doFinishOrder(order: Order, payMethod: PayMethod): PayOrderResponse {
        if (order.status != OrderStatus.UN_PAY) {
            throw BizException("订单状态异常，当前状态：${order.status.description}")
        }
        transaction {
            order.status = OrderStatus.PAID
            order.payMethod = payMethod
            order.paidTime = System.currentTimeMillis()
            OrderDao.update(order)
            updateAccountStatus(order)
        }
        logger.info("订单已支付: orderId=${order.orderId}, payMethod=$payMethod")
        return PayOrderResponse.from(order.orderId, payMethod)
    }

    open fun updateAccountStatus(order: Order) {
        try {
            val account = UserAccountDao.getById(order.accountId) ?: return
            val snapshot = JSONUtil.toBean(order.productSnapshot, OrderSnapshot::class.java) ?: return
            // 扣减积分（如果有使用积分抵扣）
            if (order.pointsUsed > 0) {
                val bizId = if (order.subscriptionPlanId.isNullOrBlank()) {
                    order.productId
                } else {
                    order.subscriptionPlanId!!
                }
                userAccountService.deductPoints(
                    account.accountId,
                    order.pointsUsed,
                    bizId,
                    "",
                    order.remark,
                    order.createBy
                )
                logger.info("积分已扣减: accountId=${account.accountId}, pointsUsed=${order.pointsUsed}")
            }

            // 单独产品订单
            val productInfo = snapshot.product
            if (productInfo != null) {
                when (productInfo.productType) {
                    ProductType.TOKEN_PACK -> {
                        // 获取产品信息以初始化流量包
                        val product = ProductDao.getById(order.productId)
                        if (product != null) {
                            tokenPackService.initTokenPackOrder(order, product)
                            OrderDao.update(order)
                        }
                        val tokenAmount = productInfo.tokenAmount?.toLong() ?: 0L
                        UserAccountDao.addTokenBalance(account.accountId, tokenAmount, order.payMethod!!.name)
                        logger.info("Token余额已增加: accountId=${account.accountId}, tokenAmount=$tokenAmount")
                    }

                    else -> {
                        logger.warn(
                            "未知的产品类型: productType=${productInfo.productType}, " +
                                "orderId=${order.orderId}"
                        )
                    }
                }
            }

            // 套餐订单
            val planInfo = snapshot.plan
            if (planInfo != null && order.subscriptionPlanId != null) {
                // 计算套餐中所有月度token配额（从TOKEN_PACK产品汇总）
                val monthlyTokenAmount = snapshot.planProducts
                    .filter { it.productType == ProductType.TOKEN_PACK }
                    .sumOf { it.tokenAmount?.toLong() ?: 0L }

                snapshot.planProducts.forEach { product ->
                    when (product.productType) {
                        ProductType.TOKEN_PACK -> {
                            // 套餐内的TOKEN_PACK产品不创建单独订单，
                            // 月度token由updateSubscribeToken统一初始化
                            logger.info(
                                "套餐内流量包产品，跳过单独初始化: productId=${product.productId}"
                            )
                        }

                        ProductType.SUBSCRIPTION -> {
                            // 获取当前套餐订阅到期时间=支付时间/当前订阅到期时间+订阅月数
                            val newEndTime = DateUtil.offsetMonth(
                                Date(account.subscriptionEndTime ?: order.paidTime!!),
                                order.quantity
                            ).toJdkDate().time
                            UserAccountDao.updateSubscription(
                                account.accountId, order.subscriptionPlanId,
                                newEndTime, order.payMethod!!.name
                            )
                            logger.info(
                                "订阅套餐已更新: accountId=${account.accountId}, " +
                                    "planId=${order.subscriptionPlanId}, endTime=$newEndTime"
                            )
                        }

                        else -> {
                            logger.warn(
                                "未知的产品类型: productType=${product.productType}, " +
                                    "productId=${product.productId}"
                            )
                        }
                    }
                }

                // 仅首次订阅开通时初始化月度token配额（续订时不重置余额）
                if (monthlyTokenAmount > 0) {
                    if (account.subscribeTokenQuota == 0L) {
                        // 历史账户，首次初始化月度token配额
                        UserAccountDao.updateSubscribeToken(
                            account.accountId,
                            monthlyTokenAmount,
                            order.payMethod!!.name
                        )
                    }
                    val currentEndTime = account.subscriptionEndTime
                    // 是否为是续订订单
                    val isRenewal = currentEndTime != null && currentEndTime > System.currentTimeMillis()
                    if (!isRenewal) {
                        UserAccountDao.updateSubscribeToken(
                            account.accountId,
                            monthlyTokenAmount,
                            order.payMethod!!.name
                        )
                        logger.info(
                            "月度订阅token已初始化: accountId=${account.accountId}, " +
                                "monthlyTokenAmount=$monthlyTokenAmount"
                        )
                    }
                }
            }
        } catch (e: Throwable) {
            logger.error("更新账户状态失败: orderId=${order.orderId}", e)
            throw e
        }
    }

    open fun generateOrderNo(product: Product?, plan: SubscriptionPlan?): String {
        val prefix = if (product != null) {
            product.productCode
        } else if (plan != null) {
            plan.planCode
        } else {
            "ORD"
        }
        val snowflakeId = IdUtil.getSnowflakeNextIdStr()
        return "${prefix}_$snowflakeId"
    }

    /**
     * 管理员查询订单列表
     */
    open fun listOrdersForAdmin(query: CommonPageQuery): PageResultDto<OrderDto> {
        val orderQuery = OrderQuery().apply {
            this.pageNum = query.pageNum
            this.pageSize = query.pageSize
            this.keyword = query.keyword
        }
        val (orders, total) = OrderDao.list(orderQuery)
        val userMap = buildOrderUserDtoMap(orders)

        return PageResultDto(
            orders.map { OrderDto.from(it, userMap[it.accountId]) },
            total,
            query.pageNum,
            query.pageSize
        )
    }

    open fun listOrdersForAdmin(query: OrderQuery): PageResultDto<OrderDto> {
        val (orders, total) = OrderDao.list(query)
        val userMap = buildOrderUserDtoMap(orders)

        return PageResultDto(
            orders.map { OrderDto.from(it, userMap[it.accountId]) },
            total,
            query.pageNum,
            query.pageSize
        )
    }

    private fun buildOrderUserDtoMap(orders: List<Order>): Map<String, OrderUserDto> {
        if (orders.isEmpty()) return emptyMap()

        val accountIds = orders.map { it.accountId }.distinct()
        val accounts = UserAccountDao.getByIds(accountIds)
        val userIds = accounts.map { it.userId }.distinct()
        val users = UserDao.getByIds(userIds)

        val accountIdToUserId = accounts.associate { it.accountId to it.userId }
        val userIdToUser = users.associateBy { it.userId }

        return accountIdToUserId.mapValues { (_, userId) -> userIdToUser[userId] }
            .mapNotNull { (accountId, user) -> user?.let { accountId to OrderUserDto.from(it) } }.toMap()
    }

    /**
     * 获取订单统计
     */
    open fun getOrderStatistics(): Map<String, Any> {
        val emptyQuery = OrderQuery()
        val total = OrderDao.count(emptyQuery)

        val pendingQuery = OrderQuery().apply {
            this.status = OrderStatus.UN_PAY
        }
        val pending = OrderDao.count(pendingQuery)

        val paidQuery = OrderQuery().apply {
            this.status = OrderStatus.PAID
        }
        val paid = OrderDao.count(paidQuery)

        val cancelledQuery = OrderQuery().apply {
            this.status = OrderStatus.CANCELLED
        }
        val cancelled = OrderDao.count(cancelledQuery)

        val refundedQuery = OrderQuery().apply {
            this.status = OrderStatus.REFUNDED
        }
        val refunded = OrderDao.count(refundedQuery)

        return mapOf(
            "total" to total,
            "pending" to pending,
            "paid" to paid,
            "cancelled" to cancelled,
            "refunded" to refunded
        )
    }
}
