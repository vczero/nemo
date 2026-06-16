package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.NotificationOperation
import com.ywllab.nemo.constant.NotificationPriority
import com.ywllab.nemo.constant.NotificationStatus
import com.ywllab.nemo.constant.NotificationType
import com.ywllab.nemo.dao.NotificationDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.notification.NotificationBatchRequest
import com.ywllab.nemo.dto.notification.NotificationCreateRequest
import com.ywllab.nemo.dto.notification.NotificationPageRequest
import com.ywllab.nemo.dto.notification.NotificationPageResponse
import com.ywllab.nemo.dto.notification.NotificationSendRequest
import com.ywllab.nemo.dto.notification.NotificationSendResponse
import com.ywllab.nemo.dto.notification.UnreadCountResponse
import com.ywllab.nemo.model.Notification
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
open class NotificationService {
    private val log = LoggerFactory.getLogger(NotificationService::class.java)

    /**
     * 创建通知
     */
    open fun add(request: NotificationCreateRequest): String {
        val now = System.currentTimeMillis()
        val notification = Notification().apply {
            notificationId = IdUtil.getSnowflakeNextIdStr()
            userId = request.userId
            type = request.type
            title = request.title
            content = request.content
            priority = request.priority
            status = NotificationStatus.UNREAD
            linkUrl = request.linkUrl
            linkId = request.linkId
            extData = request.extData
            createBy = getUserId()
            createTime = now
            updateBy = getUserId()
            updateTime = now
        }

        NotificationDao.create(notification)
        log.info(
            "Notification created, notificationId={}, userId={}, type={}",
            notification.notificationId, notification.userId, notification.type
        )
        return notification.notificationId
    }

    open fun page(request: NotificationPageRequest): PageResultDto<NotificationPageResponse> {
        val userId = getUserId()
        val (notifications, total) = NotificationDao.pageByUserId(
            userId = userId,
            pageNum = request.pageNum.toInt(),
            pageSize = request.pageSize.toInt(),
            types = request.types,
            status = request.status,
            priority = request.priority
        )

        val responses = notifications.map { notification ->
            NotificationPageResponse().apply {
                notificationId = notification.notificationId
                type = notification.type
                title = notification.title
                content = notification.content
                priority = notification.priority
                status = notification.status
                linkUrl = notification.linkUrl
                linkId = notification.linkId
                createTime = notification.createTime
                readTime = notification.readTime
            }
        }

        return PageResultDto(responses, total, request.pageNum, request.pageSize)
    }

    open fun batchOperation(request: NotificationBatchRequest) {
        val userId = getUserId()
        if (request.notificationIds.isEmpty()) {
            return
        }

        when (request.operation) {
            NotificationOperation.MARK_READ -> {
                NotificationDao.batchMarkAsRead(request.notificationIds, userId)
                log.info(
                    "Batch marked notifications as read, count={}, userId={}",
                    request.notificationIds.size,
                    userId
                )
            }

            NotificationOperation.MARK_UNREAD -> {
                NotificationDao.batchMarkAsUnread(request.notificationIds, userId)
                log.info(
                    "Batch marked notifications as unread, count={}, userId={}",
                    request.notificationIds.size,
                    userId
                )
            }

            NotificationOperation.DELETE -> {
                NotificationDao.batchDelete(request.notificationIds, userId)
                log.info("Batch deleted notifications, count={}, userId={}", request.notificationIds.size, userId)
            }
        }
    }

    /**
     * 全部标记已读
     */
    open fun markAllAsRead() {
        val userId = getUserId()
        NotificationDao.markAllAsRead(userId)
        log.info("All notifications marked as read, userId={}", userId)
    }

    /**
     * 获取未读数量
     */
    open fun getUnreadCount(): UnreadCountResponse {
        val userId = getUserId()
        return UnreadCountResponse().apply {
            total = NotificationDao.countByCondition(userId, NotificationStatus.UNREAD, null)
        }
    }

    /**
     * 发送系统通知（供其他服务调用的公共方法）
     */
    open fun sendSystemNotification(
        userId: String,
        title: String,
        content: String,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        linkUrl: String? = null,
        linkId: String? = null
    ): String {
        val now = System.currentTimeMillis()
        val notification = Notification().apply {
            notificationId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            type = NotificationType.SYSTEM
            this.title = title
            this.content = content
            this.priority = priority
            status = NotificationStatus.UNREAD
            this.linkUrl = linkUrl
            this.linkId = linkId
            createBy = "SYSTEM"
            createTime = now
            updateBy = "SYSTEM"
            updateTime = now
        }

        NotificationDao.create(notification)
        log.info("System notification sent, notificationId={}, userId={}", notification.notificationId, userId)
        return notification.notificationId
    }

    /**
     * 发送开票通知
     */
    open fun sendInvoiceNotification(
        userId: String,
        title: String,
        content: String,
        invoiceId: String,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        linkUrl: String? = null
    ): String {
        val now = System.currentTimeMillis()
        val notification = Notification().apply {
            notificationId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            type = NotificationType.INVOICE
            this.title = title
            this.content = content
            this.priority = priority
            status = NotificationStatus.UNREAD
            this.linkUrl = linkUrl
            this.linkId = invoiceId
            createBy = "SYSTEM"
            createTime = now
            updateBy = "SYSTEM"
            updateTime = now
        }

        NotificationDao.create(notification)
        log.info("发票开具通知发送, userId={}, invoiceId={}", userId, invoiceId)
        return notification.notificationId
    }

    /**
     * 发送计算任务通知
     */
    open fun sendComputeNotification(
        userId: String,
        title: String,
        content: String,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        linkUrl: String? = null,
        linkId: String? = null
    ): String {
        val now = System.currentTimeMillis()
        val notification = Notification().apply {
            notificationId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            type = NotificationType.COMPUTE
            this.title = title
            this.content = content
            this.priority = priority
            status = NotificationStatus.UNREAD
            this.linkUrl = linkUrl
            this.linkId = linkId
            createBy = "SYSTEM"
            createTime = now
            updateBy = "SYSTEM"
            updateTime = now
        }

        NotificationDao.create(notification)
        log.info("计算任务通知发送, notificationId={}, userId={}", notification.notificationId, userId)
        return notification.notificationId
    }

    // ==================== 管理员专用方法 ====================

    /**
     * 管理员分页查询所有系统通知
     */
    open fun pageForAdmin(request: NotificationPageRequest): PageResultDto<NotificationPageResponse> {
        val (notifications, total) = NotificationDao.pageForAdmin(
            pageNum = request.pageNum.toInt(),
            pageSize = request.pageSize.toInt(),
            status = request.status,
            priority = request.priority,
            userId = request.targetUserId,
            startTime = request.startTime,
            endTime = request.endTime,
            types = request.types
        )

        // 批量获取用户信息
        val userIds = notifications.map { it.userId }.distinct()
        val usersMap = com.ywllab.nemo.dao.UserDao.getByIds(userIds).associateBy { it.userId }

        val responses = notifications.map { notification ->
            val user = usersMap[notification.userId]
            NotificationPageResponse().apply {
                notificationId = notification.notificationId
                userId = notification.userId
                userName = user?.nickname ?: user?.username ?: ""
                type = notification.type
                title = notification.title
                content = notification.content
                priority = notification.priority
                status = notification.status
                linkUrl = notification.linkUrl
                linkId = notification.linkId
                createTime = notification.createTime
                readTime = notification.readTime
            }
        }

        return PageResultDto(responses, total, request.pageNum, request.pageSize)
    }

    /**
     * 管理员为所有用户发送系统通知
     */
    open fun sendSystemNotificationToAllUsers(request: NotificationCreateRequest): List<String> {
        // todo 优化：改为分批处理
        val userIds = NotificationDao.getAllActiveUserIds()
        val now = System.currentTimeMillis()
        val currentUserId = getUserId()

        val notifications = userIds.map { userId ->
            Notification().apply {
                notificationId = IdUtil.getSnowflakeNextIdStr()
                this.userId = userId
                type = NotificationType.SYSTEM
                title = request.title
                content = request.content
                priority = request.priority
                status = NotificationStatus.UNREAD
                linkUrl = request.linkUrl
                linkId = request.linkId
                extData = request.extData
                createBy = currentUserId
                createTime = now
                updateBy = currentUserId
                updateTime = now
            }
        }

        NotificationDao.batchCreate(notifications)
        val notificationIds = notifications.map { it.notificationId }

        log.info(
            "System notification sent to all users, count={}, notificationIds={}",
            notificationIds.size,
            notificationIds.take(3)
        )
        return notificationIds
    }

    /**
     * 管理员发送系统通知（支持指定用户或全部用户）
     */
    open fun sendSystemNotification(request: NotificationSendRequest): NotificationSendResponse {
        val targetUserIds = request.userIds?.takeIf { it.isNotEmpty() }
            ?: NotificationDao.getAllActiveUserIds()

        val now = System.currentTimeMillis()
        val currentUserId = getUserId()

        val notifications = targetUserIds.map { userId ->
            Notification().apply {
                notificationId = IdUtil.getSnowflakeNextIdStr()
                this.userId = userId
                type = NotificationType.SYSTEM
                title = request.title
                content = request.content
                priority = request.priority
                status = NotificationStatus.UNREAD
                linkUrl = request.linkUrl
                linkId = request.linkId
                extData = request.extData
                createBy = currentUserId
                createTime = now
                updateBy = currentUserId
                updateTime = now
            }
        }

        NotificationDao.batchCreate(notifications)
        val notificationIds = notifications.map { it.notificationId }
        val isAllUsers = request.userIds.isNullOrEmpty()
        log.info(
            "System notification sent by admin, isAllUsers={}, count={}",
            isAllUsers,
            notificationIds.size
        )

        return NotificationSendResponse.of(
            count = notificationIds.size,
            isAllUsers = isAllUsers,
            message = if (isAllUsers) "已向${notificationIds.size}位用户发送系统通知"
            else "已向${notificationIds.size}位指定用户发送系统通知"
        )
    }

    /**
     * 管理员批量删除系统通知
     */
    open fun batchDeleteSystemNotifications(notificationIds: List<String>) {
        if (notificationIds.isEmpty()) {
            return
        }
        NotificationDao.batchHardDeleteForAdmin(notificationIds)
        log.info("Batch deleted system notifications by admin, count={}", notificationIds.size)
    }

    /**
     * 管理员更新系统通知
     */
    open fun updateSystemNotification(
        notificationId: String,
        request: NotificationCreateRequest
    ): String {
        val existing = NotificationDao.getByNotificationId(notificationId)
            ?: throw IllegalArgumentException("Notification not found: $notificationId")

        if (existing.type != NotificationType.SYSTEM) {
            throw IllegalArgumentException("Only SYSTEM notifications can be updated")
        }

        val now = System.currentTimeMillis()
        val updated = existing.apply {
            title = request.title
            content = request.content
            priority = request.priority
            linkUrl = request.linkUrl
            linkId = request.linkId
            extData = request.extData
            updateBy = getUserId()
            updateTime = now
        }

        NotificationDao.updateForAdmin(updated)
        log.info("System notification updated by admin, notificationId={}", notificationId)
        return notificationId
    }
}
