package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.notification.NotificationCreateRequest
import com.ywllab.nemo.dto.notification.NotificationIdsRequest
import com.ywllab.nemo.dto.notification.NotificationPageRequest
import com.ywllab.nemo.dto.notification.NotificationPageResponse
import com.ywllab.nemo.dto.notification.NotificationSendRequest
import com.ywllab.nemo.dto.notification.NotificationSendResponse
import com.ywllab.nemo.service.NotificationService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-通知管理"])
@RestController
@RequestMapping("/boss/api/notifications")
open class BossNotificationController {

    @Autowired
    lateinit var notificationService: NotificationService

    @ApiOperation("发送系统通知（支持指定用户或全部用户）")
    @PostMapping("/send")
    open fun send(@RequestBody request: NotificationSendRequest): ResultDto<NotificationSendResponse> {
        val result = notificationService.sendSystemNotification(request)
        return ResultDto.success(result)
    }

    @ApiOperation("分页查询-系统通知")
    @PostMapping("/page")
    open fun page(@RequestBody request: NotificationPageRequest): ResultDto<PageResultDto<NotificationPageResponse>> {
        return ResultDto.success(notificationService.pageForAdmin(request))
    }

    @ApiOperation("更新系统通知")
    @PostMapping("/update/{notificationId}")
    open fun update(
        @PathVariable notificationId: String,
        @RequestBody request: NotificationCreateRequest
    ): ResultDto<String> {
        val updatedId = notificationService.updateSystemNotification(notificationId, request)
        return ResultDto.success(updatedId)
    }

    @ApiOperation("批量删除系统通知")
    @PostMapping("/batch-delete")
    open fun batchDelete(@RequestBody request: NotificationIdsRequest): ResultDto<String> {
        notificationService.batchDeleteSystemNotifications(request.notificationIds)
        return ResultDto.success("成功删除${request.notificationIds.size}条系统通知")
    }
}
