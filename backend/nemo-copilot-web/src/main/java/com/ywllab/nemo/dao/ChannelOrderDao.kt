package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.ChannelOrderStatus
import com.ywllab.nemo.constant.ChannelOrderType
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.dto.channel.ChannelOrderPageParam
import com.ywllab.nemo.model.ChannelOrder
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object ChannelOrderDao : BaseDao<ChannelOrder>("nemo_channel_order") {

    val orderId = varchar("order_id", 32)
    val channelName = varchar("channel_name", 64)
    val channelOrderNo = varchar("channel_order_no", 128).nullable()
    val channelOrderAmount = decimal("channel_order_amount", 12, 2)
    val status = enumerationByName<ChannelOrderStatus>("status", 32)
    val channelOrderType = enumerationByName<ChannelOrderType>("channel_order_type", 32)
    val email = varchar("email", 128)
    val subscriptionPlanId = varchar("subscription_plan_id", 32)
    val subscriptionMonths = integer("subscription_months")
    val channelGrantTime = long("channel_grant_time")
    val userActivationTime = long("user_activation_time").nullable()

    override val primaryKey = PrimaryKey(orderId)

    private val self = this

    override fun createModel(): ChannelOrder {
        return ChannelOrder()
    }

    fun create(channelOrder: ChannelOrder) {
        val now = System.currentTimeMillis()
        transaction {
            self.insert {
                it[orderId] = channelOrder.orderId
                it[channelName] = channelOrder.channelName
                it[channelOrderNo] = channelOrder.channelOrderNo
                it[channelOrderAmount] = channelOrder.channelOrderAmount
                it[status] = channelOrder.status
                it[channelOrderType] = channelOrder.channelOrderType
                it[email] = channelOrder.email
                it[subscriptionPlanId] = channelOrder.subscriptionPlanId
                it[subscriptionMonths] = channelOrder.subscriptionMonths
                it[channelGrantTime] = channelOrder.channelGrantTime
                it[userActivationTime] = channelOrder.userActivationTime
                it[createBy] = channelOrder.createBy
                it[createTime] = now
                it[updateBy] = channelOrder.updateBy
                it[updateTime] = now
            }
        }
    }

    fun getById(idParam: String): ChannelOrder? {
        return transaction {
            select { self.orderId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getPendingByEmail(emailParam: String): List<ChannelOrder> {
        return transaction {
            select {
                (self.email eq emailParam) and (self.status eq ChannelOrderStatus.PENDING_ACTIVATION)
            }.map(mapper)
        }
    }

    fun page(query: ChannelOrderPageParam): Pair<List<ChannelOrder>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = query.pageNum
            this.pageSize = query.pageSize
        }
        return page(pageQuery) {
            buildQueryCondition(query)
        }
    }

    private fun buildQueryCondition(query: ChannelOrderPageParam): Op<Boolean> {
        var condition: Op<Boolean> = Op.TRUE

        val statusParam = query.status
        if (statusParam != null) {
            condition = condition and (this.status eq statusParam)
        }

        val emailParam = query.email
        if (!emailParam.isNullOrBlank()) {
            condition = condition and (this.email like "%$emailParam%")
        }

        val channelOrderNoParam = query.channelOrderNo
        if (!channelOrderNoParam.isNullOrBlank()) {
            condition = condition and (this.channelOrderNo like "%$channelOrderNoParam%")
        }

        val startTime = query.startTime
        if (startTime != null) {
            condition = condition and (this.channelGrantTime greaterEq startTime)
        }

        val endTime = query.endTime
        if (endTime != null) {
            condition = condition and (this.channelGrantTime lessEq endTime)
        }

        return condition
    }

    fun updateStatus(
        idParam: String,
        newStatus: ChannelOrderStatus,
        activationTime: Long = System.currentTimeMillis()
    ) {
        transaction {
            update({ self.orderId eq idParam }) {
                it[status] = newStatus
                it[userActivationTime] = activationTime
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun getByChannelOrderNo(channelOrderNo: String): ChannelOrder? {
        return transaction {
            select { self.channelOrderNo eq channelOrderNo }
                .map(mapper)
                .firstOrNull()
        }
    }
}
