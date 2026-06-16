package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.ChannelOrderStatus
import com.ywllab.nemo.constant.ChannelOrderType
import com.ywllab.nemo.constant.OrderSource
import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.dao.ChannelOrderDao
import com.ywllab.nemo.dao.OrderDao
import com.ywllab.nemo.dao.SubscriptionPlanDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.channel.ChannelOrderCreateRequest
import com.ywllab.nemo.dto.channel.ChannelOrderPageParam
import com.ywllab.nemo.dto.channel.ChannelOrderResponse
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.model.ChannelOrder
import com.ywllab.nemo.model.Order
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.math.BigDecimal

@Service
open class ChannelOrderService {
    val log = LoggerFactory.getLogger(javaClass)

    @Autowired
    private lateinit var orderService: OrderService

    // fixme 新注册后，要初始化账户的token情况
    fun createChannelOrder(request: ChannelOrderCreateRequest, operator: String): ChannelOrderResponse {
        val pendingOrders = ChannelOrderDao.getPendingByEmail(request.email)
        if (pendingOrders.isNotEmpty() && pendingOrders.first().channelOrderType == ChannelOrderType.NEW_ACCOUNT) {
            throw BizException("新用户${request.email}存在待激活订单，不能重复创建")
        }
        if (!request.channelOrderNo.isNullOrBlank()) {
            val existingOrder = ChannelOrderDao.getByChannelOrderNo(request.channelOrderNo!!)
            if (existingOrder != null) {
                throw BizException("渠道订单号${request.channelOrderNo!!}已存在")
            }
        }

        // 校验用户邮箱是否存在，并判断渠道订单类型
        val existingUser = UserDao.getByEmail(request.email)
        val channelOrderType = if (existingUser == null) {
            ChannelOrderType.NEW_ACCOUNT
        } else {
            ChannelOrderType.RENEWAL
        }

        val channelOrder = ChannelOrder().apply {
            this.orderId = IdUtil.getSnowflakeNextIdStr()
            this.channelName = request.channelName
            this.channelOrderNo = request.channelOrderNo
            this.channelOrderAmount = request.channelOrderAmount ?: BigDecimal.ZERO
            this.status = ChannelOrderStatus.PENDING_ACTIVATION
            this.email = request.email
            this.subscriptionPlanId = request.subscriptionPlanId
            this.subscriptionMonths = request.subscriptionMonths
            this.channelGrantTime = request.channelGrantTime ?: System.currentTimeMillis()
            this.channelOrderType = channelOrderType
            this.createBy = operator
            this.updateBy = operator
        }

        transaction {
            ChannelOrderDao.create(channelOrder)
            // 老用户(续期): 立即创建内部订单并激活
            if (channelOrderType == ChannelOrderType.RENEWAL) {
                val account = UserAccountDao.getByUserId(existingUser!!.userId)!!
                activateChannelOrder(channelOrder, account.accountId, operator)
            }
        }
        val response = ChannelOrderResponse.from(channelOrder)
        response.creatorName = UserDao.getById(operator)?.username
        return response
    }

    fun pageChannelOrders(param: ChannelOrderPageParam): PageResultDto<ChannelOrderResponse> {
        val (list, total) = ChannelOrderDao.page(param)

        // 批量查询创建人名称
        val creatorIds = list.map { it.createBy }.distinct()
        val creators = if (creatorIds.isNotEmpty()) {
            UserDao.getByIds(creatorIds).associate { it.userId to it.username }
        } else {
            emptyMap()
        }

        val responses = list.map { channelOrder ->
            ChannelOrderResponse.from(channelOrder).apply {
                this.creatorName = channelOrder.createBy.let { creators[it] }
            }
        }

        return PageResultDto(responses, total, param)
    }

    fun getChannelOrder(orderId: String): ChannelOrderResponse? {
        val channelOrder = ChannelOrderDao.getById(orderId) ?: return null
        val response = ChannelOrderResponse.from(channelOrder)
        channelOrder.createBy?.let { creatorId ->
            response.creatorName = UserDao.getById(creatorId)?.username
        }
        return response
    }

    /**
     * 激活渠道订单：创建内部套餐订单并模拟支付完成
     */
    open fun activateChannelOrder(channelOrder: ChannelOrder, accountId: String, operator: String) {
        val subscriptionPlan = SubscriptionPlanDao.get(channelOrder.subscriptionPlanId)!!
        val planSnapshot = orderService.toOrderSnapshot(null, subscriptionPlan, channelOrder.subscriptionMonths)
        val order = Order().apply {
            this.orderId = channelOrder.orderId
            this.orderNo = orderService.generateOrderNo(null, plan = subscriptionPlan)
            this.accountId = accountId
            this.subscriptionPlanId = channelOrder.subscriptionPlanId
            this.quantity = channelOrder.subscriptionMonths
            this.payAmount = channelOrder.channelOrderAmount.toDouble()
            this.productSnapshot = planSnapshot
            this.source = OrderSource.TO_B
            this.updateBy = operator
            this.createBy = operator
            this.status = OrderStatus.UN_PAY
        }
        transaction {
            // 创建内部套餐订单
            OrderDao.create(order)
            // 模拟支付完成
            orderService.finishOrder(order.orderNo, order.payAmount, payMethod = PayMethod.EXTERNAL)
            // 更新渠道订单状态
            ChannelOrderDao.updateStatus(channelOrder.orderId, ChannelOrderStatus.ACTIVATED)
        }
    }
}
