package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.constant.ProductType
import com.ywllab.nemo.constant.TokenPackStatus
import com.ywllab.nemo.dao.CacheDao
import com.ywllab.nemo.dao.OrderDao
import com.ywllab.nemo.dao.ProductDao
import com.ywllab.nemo.dao.TokenUsageRecordDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.tokenpack.TokenPackOrderDto
import com.ywllab.nemo.dto.tokenpack.TokenPackProductDto
import com.ywllab.nemo.model.Order
import com.ywllab.nemo.model.Product
import com.ywllab.nemo.model.TokenUsageRecord
import com.ywllab.nemo.model.UserAccount
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
open class TokenPackService {
    val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        const val CACHE_TYPE_TOKEN_USAGE = "TOKEN_USAGE"
        const val CACHE_TTL_MINUTES = 10 * 60 * 1000L // 10分钟
    }

    /**
     * 查询流量包产品列表
     */
    open fun listTokenPackProducts(): List<TokenPackProductDto> {
        val products = ProductDao.listActive()
            .filter { it.productType == ProductType.TOKEN_PACK }
            // 忽略在标准套餐内的流量包产品
            .filter { it.subscriptionPlanId.isNullOrBlank() }

        return products.map { TokenPackProductDto.from(it) }
    }

    /**
     * 查询我的流量包订单列表
     */
    open fun getMyTokenPackOrders(param: CommonPageQuery): PageResultDto<TokenPackOrderDto> {
        val userId = UserSessionHelper.getUserId()
        val account = UserAccountDao.getByUserId(userId) ?: return PageResultDto()

        val (orders, total) = OrderDao.getTokenPackOrders(account.accountId, param)
        val dtos = orders.map { order ->
            val product = ProductDao.getById(order.productId)
            val usedAmount = calculateOrderUsedToken(order.orderId)
            TokenPackOrderDto.from(order, product, usedAmount)
        }

        return PageResultDto(dtos, total, param.pageNum, param.pageSize)
    }

    /**
     * 计算订单已使用流量（带缓存，10分钟）
     */
    open fun calculateOrderUsedToken(orderId: String): Long {
        val cacheKey = "TOKEN_USED_$orderId"

        // 尝试从缓存获取
        val cached = CacheDao.get(cacheKey, CACHE_TTL_MINUTES)
        if (cached != null) {
            return cached.toLongOrNull() ?: 0L
        }

        // 从数据库查询
        val usedAmount = TokenUsageRecordDao.getUsedAmountByOrderId(orderId)

        // 写入缓存
        CacheDao.put(cacheKey, CACHE_TYPE_TOKEN_USAGE, usedAmount.toString())

        return usedAmount
    }

    /**
     * 扣减流量（内部接口）
     * 优先扣减月度订阅token（subscribeTokenBalance），不足不再扣流量包
     *
     * @param accountId 账户ID
     * @param amount 需要扣减的数量
     * @param bizType 业务类型
     * @param bizId 业务ID
     * @return 实际扣减数量
     */
    open fun deductToken(accountId: String, amount: Long, bizType: ComputeType, bizId: String): Long {
        if (amount <= 0) return 0L

        val account = UserAccountDao.getById(accountId) ?: return 0L

        // 优先扣减月度订阅token
        if (account.subscribeTokenBalance > 0) {
            val deductAmount = minOf(account.subscribeTokenBalance, amount)
            transaction {
                val planOrder = OrderDao.getByPlanId(account.currentPlanId!!, pageNum = 1, pageSize = 1).first.first()
                val balanceBefore = account.subscribeTokenBalance
                recordTokenUsage(planOrder, account, bizType, bizId, deductAmount, balanceBefore)

                UserAccountDao.deductSubscribeTokenBalance(accountId, deductAmount)
            }
            logger.info("月度订阅token扣减: accountId=$accountId, deductAmount=$deductAmount")
            return deductAmount
        }

        // 扣减一次性购买的流量包（按过期时间FIFO）
        val tokenOrder = OrderDao.getActiveTokenPackOrders(accountId) ?: run {
            logger.warn("没有可用的流量包: accountId=$accountId")
            return 0L
        }
        if (tokenOrder.tokenRemainingAmount <= 0) {
            return 0L
        }

        val deductAmount = minOf(tokenOrder.tokenRemainingAmount, amount)
        transaction {
            recordTokenUsage(tokenOrder, account, bizType, bizId, deductAmount, tokenOrder.tokenRemainingAmount)
            val newStatus = if (tokenOrder.tokenRemainingAmount - deductAmount <= 0) TokenPackStatus.EXHAUSTED else null
            OrderDao.updateTokenRemainingAmount(tokenOrder.orderId, deductAmount, newStatus)
            UserAccountDao.deductTokenBalance(accountId, deductAmount)
        }
        CacheDao.remove("TOKEN_USED_${tokenOrder.orderId}")
        logger.info("流量包扣减: accountId=$accountId, orderId=${tokenOrder.orderId}, deductAmount=$deductAmount")
        return deductAmount
    }

    private fun recordTokenUsage(
        tokenOrder: Order,
        account: UserAccount,
        bizType: ComputeType,
        bizId: String,
        deductAmount: Long,
        balanceBefore: Long
    ): TokenUsageRecord {
        val record = TokenUsageRecord().apply {
            recordId = IdUtil.getSnowflakeNextIdStr()
            this.accountId = account.accountId
            orderId = tokenOrder.orderId
            productId = tokenOrder.productId
            this.balanceBefore = balanceBefore
            this.balanceAfter = balanceBefore - deductAmount
            usedAmount = deductAmount
            this.bizType = bizType
            this.bizId = bizId
        }
        TokenUsageRecordDao.create(record, account.userId)
        return record
    }

    /**
     * 初始化订单流量包信息（支付成功后调用）
     */
    open fun initTokenPackOrder(order: Order, product: Product) {
        val validityDays = product.validityDays ?: 30 // 默认30天

        order.tokenRemainingAmount = product.tokenAmount?.toLong() ?: 0L
        order.tokenPackStatus = TokenPackStatus.ACTIVE
        order.expireTime = System.currentTimeMillis() + validityDays * 24L * 60 * 60 * 1000

        logger.info(
            "初始化流量包订单: orderId=${order.orderId}, " +
                "initialAmount=${product.tokenAmount?.toLong() ?: 0L}, " +
                "validityDays=$validityDays, expireTime=${order.expireTime}"
        )
    }
}
