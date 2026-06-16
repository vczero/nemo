package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.notification.NotificationBatchRequest
import com.ywllab.nemo.dto.notification.NotificationPageRequest
import com.ywllab.nemo.dto.notification.NotificationPageResponse
import com.ywllab.nemo.dto.notification.UnreadCountResponse
import com.ywllab.nemo.service.NotificationService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["通知"])
@RestController
@RequestMapping("/api/notifications")
open class NotificationController {

    @Autowired
    lateinit var notificationService: NotificationService

    @ApiOperation("分页查询")
    @PostMapping("/page")
    open fun page(@RequestBody request: NotificationPageRequest): ResultDto<PageResultDto<NotificationPageResponse>> {
        return ResultDto.success(notificationService.page(request))
    }

    @ApiOperation("未读数量")
    @GetMapping("/unread-count")
    open fun getUnreadCount(): ResultDto<UnreadCountResponse> {
        val count = notificationService.getUnreadCount()
        return ResultDto.success(count)
    }

    @ApiOperation("全部标记已读")
    @PostMapping("/mark-all-read")
    open fun markAllAsRead(): ResultDto<String> {
        notificationService.markAllAsRead()
        return ResultDto.success("全部标记成功")
    }

    @ApiOperation("批量操作（标记已读、标记未读、删除）")
    @PostMapping("/batch-operation")
    open fun batchOperation(@RequestBody param: NotificationBatchRequest): ResultDto<String> {
        notificationService.batchOperation(param)
        return ResultDto.success("操作成功")
    }
}
