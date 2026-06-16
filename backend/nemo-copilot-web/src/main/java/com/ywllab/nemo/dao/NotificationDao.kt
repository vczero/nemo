package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.NotificationPriority
import com.ywllab.nemo.constant.NotificationStatus
import com.ywllab.nemo.constant.NotificationType
import com.ywllab.nemo.model.Notification
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.neq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.batchInsert
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object NotificationDao : BaseDao<Notification>("nemo_notification") {
    val notificationId = varchar("notification_id", 32)
    val userId = varchar("user_id", 32)
    val type = enumerationByName<NotificationType>("type", 32)
    val title = varchar("title", 500)
    val content = text("content")
    val priority = enumerationByName<NotificationPriority>("priority", 32)
    val status = enumerationByName<NotificationStatus>("status", 32)
    val readTime = long("read_time").nullable()
    val linkUrl = varchar("link_url", 500).nullable()
    val linkId = varchar("link_id", 64).nullable()
    val extData = text("ext_data").nullable()

    override val primaryKey = PrimaryKey(notificationId)

    private val self = this

    override fun createModel(): Notification = Notification()

    fun create(notification: Notification) {
        transaction {
            self.insert {
                it[notificationId] = notification.notificationId
                it[userId] = notification.userId
                it[type] = notification.type
                it[title] = notification.title
                it[content] = notification.content
                it[priority] = notification.priority
                it[status] = notification.status
                it[readTime] = notification.readTime
                it[linkUrl] = notification.linkUrl
                it[linkId] = notification.linkId
                it[extData] = notification.extData
                it[createBy] = notification.createBy
                it[createTime] = notification.createTime
                it[updateBy] = notification.updateBy
                it[updateTime] = notification.updateTime
            }
        }
    }

    /**
     * 批量创建通知（O(1) 单次DB操作）
     */
    fun batchCreate(notifications: List<Notification>) {
        if (notifications.isEmpty()) return
        transaction {
            self.batchInsert(notifications) {
                this[notificationId] = it.notificationId
                this[userId] = it.userId
                this[self.type] = it.type
                this[title] = it.title
                this[content] = it.content
                this[priority] = it.priority
                this[status] = it.status
                this[readTime] = it.readTime
                this[linkUrl] = it.linkUrl
                this[linkId] = it.linkId
                this[extData] = it.extData
                this[createBy] = it.createBy
                this[createTime] = System.currentTimeMillis()
                this[updateBy] = it.updateBy
                this[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun update(notification: Notification) {
        transaction {
            update({ notificationId eq notification.notificationId }) {
                it[title] = notification.title
                it[content] = notification.content
                it[priority] = notification.priority
                it[status] = notification.status
                it[readTime] = notification.readTime
                it[linkUrl] = notification.linkUrl
                it[linkId] = notification.linkId
                it[extData] = notification.extData
                it[updateBy] = notification.updateBy
                it[updateTime] = notification.updateTime
            }
        }
    }

    fun getByNotificationId(notificationId: String): Notification? {
        return transaction {
            select { self.notificationId eq notificationId }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun pageByUserId(
        userId: String,
        pageNum: Int,
        pageSize: Int,
        types: List<NotificationType> = listOf(),
        status: List<NotificationStatus> = listOf(),
        priority: NotificationPriority? = null
    ): Pair<List<Notification>, Long> {
        return transaction {
            var condition: Op<Boolean> = self.userId eq userId
            if (types.isNotEmpty()) {
                condition = condition and (self.type inList types)
            }
            if (status.isNotEmpty()) {
                condition = condition and (self.status inList status)
            }
            if (priority != null) {
                condition = condition and (self.priority eq priority)
            }
            // 排除已删除的通知
            condition = condition and (self.status neq NotificationStatus.DELETED)

            val data = select(condition)
                .orderBy(createTime, SortOrder.DESC)
                .limit(pageSize, (pageNum - 1).toLong())
                .map(mapper)
            val total = select(condition).count()
            Pair(data, total)
        }
    }

    fun markAsRead(notificationId: String, userId: String) {
        transaction {
            update({ (self.notificationId eq notificationId) and (self.userId eq userId) }) {
                it[status] = NotificationStatus.READ
                it[readTime] = System.currentTimeMillis()
            }
        }
    }

    fun markAsUnread(notificationId: String, userId: String) {
        transaction {
            update({ (self.notificationId eq notificationId) and (self.userId eq userId) }) {
                it[status] = NotificationStatus.UNREAD
                it[readTime] = null
            }
        }
    }

    fun batchMarkAsRead(notificationIds: List<String>, userId: String) {
        transaction {
            update({
                (self.notificationId inList notificationIds) and
                    (self.userId eq userId) and
                    (self.status eq NotificationStatus.UNREAD)
            }) {
                it[status] = NotificationStatus.READ
                it[readTime] = System.currentTimeMillis()
            }
        }
    }

    fun batchMarkAsUnread(notificationIds: List<String>, userId: String) {
        transaction {
            update({
                (self.notificationId inList notificationIds) and
                    (self.userId eq userId) and
                    (self.status eq NotificationStatus.READ)
            }) {
                it[status] = NotificationStatus.UNREAD
                it[readTime] = null
            }
        }
    }

    fun batchDelete(notificationIds: List<String>, userId: String) {
        transaction {
            update({
                (self.notificationId inList notificationIds) and
                    (self.userId eq userId)
            }) {
                it[status] = NotificationStatus.DELETED
            }
        }
    }

    fun markAllAsRead(userId: String) {
        transaction {
            update({ (self.userId eq userId) and (self.status eq NotificationStatus.UNREAD) }) {
                it[status] = NotificationStatus.READ
                it[readTime] = System.currentTimeMillis()
            }
        }
    }

    fun countUnread(userId: String): Long {
        return transaction {
            select { (self.userId eq userId) and (self.status eq NotificationStatus.UNREAD) }.count()
        }
    }

    fun countByCondition(userId: String, status: NotificationStatus?, priority: NotificationPriority?): Long {
        return transaction {
            var condition: Op<Boolean> = self.userId eq userId
            if (status != null) {
                condition = condition and (self.status eq status)
            }
            if (priority != null) {
                condition = condition and (self.priority eq priority)
            }
            select(condition).count()
        }
    }

    fun delete(notificationId: String, userId: String) {
        transaction {
            // 软删除：更新状态为DELETED
            update({ (self.notificationId eq notificationId) and (self.userId eq userId) }) {
                it[status] = NotificationStatus.DELETED
            }
        }
    }

    fun hardDelete(notificationId: String) {
        transaction {
            deleteWhere { self.notificationId eq notificationId }
        }
    }

    // ==================== 管理员专用方法 ====================

    /**
     * 管理员分页查询通知（支持类型数组筛选）
     * @param types 如果为空，查所有类型
     */
    fun pageForAdmin(
        pageNum: Int,
        pageSize: Int,
        status: List<NotificationStatus> = listOf(),
        priority: NotificationPriority? = null,
        userId: String? = null,
        startTime: Long? = null,
        endTime: Long? = null,
        types: List<NotificationType> = listOf()
    ): Pair<List<Notification>, Long> {
        return transaction {
            // 如果指定了类型数组，按数组筛选；否则查所有类型
            var condition: Op<Boolean> = if (types.isNotEmpty()) {
                self.type inList types
            } else {
                Op.TRUE
            }
            if (status.isNotEmpty()) {
                condition = condition and (self.status inList status)
            }
            if (priority != null) {
                condition = condition and (self.priority eq priority)
            }
            if (!userId.isNullOrEmpty()) {
                condition = condition and (self.userId eq userId)
            }
            if (startTime != null) {
                condition = condition and (self.createTime greaterEq startTime)
            }
            if (endTime != null) {
                condition = condition and (self.createTime lessEq endTime)
            }
            // 排除已删除的通知
            condition = condition and (self.status neq NotificationStatus.DELETED)

            val data = select(condition)
                .orderBy(createTime, SortOrder.DESC)
                .limit(pageSize, (pageNum - 1).toLong())
                .map(mapper)
            val total = select(condition).count()
            Pair(data, total)
        }
    }

    /**
     * 管理员批量删除系统通知（物理删除）
     */
    fun batchHardDeleteForAdmin(notificationIds: List<String>) {
        transaction {
            deleteWhere { (self.notificationId inList notificationIds) and (self.type eq NotificationType.SYSTEM) }
        }
    }

    /**
     * 管理员更新通知
     */
    fun updateForAdmin(notification: Notification) {
        transaction {
            update({ self.notificationId eq notification.notificationId }) {
                it[title] = notification.title
                it[content] = notification.content
                it[priority] = notification.priority
                it[linkUrl] = notification.linkUrl
                it[linkId] = notification.linkId
                it[extData] = notification.extData
                it[updateBy] = notification.updateBy
                it[updateTime] = notification.updateTime
            }
        }
    }

    /**
     * 管理员获取所有活跃用户ID列表
     */
    fun getAllActiveUserIds(): List<String> {
        return transaction {
            val map: List<String> = UserDao.slice(UserDao.userId)
                .select { UserDao.status eq "ACTIVE" }
                .map { it[UserDao.userId] }
            map
        }
    }
}
