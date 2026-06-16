package com.ywllab.nemo.web.controller

import com.ywllab.nemo.annotation.Permission
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.story.StoryCreateRequest
import com.ywllab.nemo.dto.story.StoryDetailResponse
import com.ywllab.nemo.dto.story.StoryPageRequest
import com.ywllab.nemo.dto.story.StoryPageResponse
import com.ywllab.nemo.dto.story.StoryUpdateRequest
import com.ywllab.nemo.service.StoryService
import com.ywllab.nemo.web.aspect.StandardSubscriptionAuthority
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["故事"])
@RestController
@RequestMapping("/api/stories")
open class StoryController {

    @Autowired
    lateinit var storyService: StoryService

    @ApiOperation("分页查询故事列表")
    @PostMapping("/page")
    open fun page(@RequestBody request: StoryPageRequest): ResultDto<PageResultDto<StoryPageResponse>> {
        return ResultDto.success(storyService.page(request))
    }

    @ApiOperation("查询故事详情(含图表列表)")
    @GetMapping("/{storyId}/get")
    open fun detail(@ApiParam("故事ID") @PathVariable storyId: String): ResultDto<StoryDetailResponse?> {
        return ResultDto.success(storyService.get(storyId))
    }

    @ApiOperation("创建故事")
    @PostMapping("/add")
    @Permission(StandardSubscriptionAuthority::class)
    open fun add(@RequestBody request: StoryCreateRequest): ResultDto<String> {
        val storyId = storyService.createStory(request)
        return ResultDto.success(storyId)
    }

    @ApiOperation("更新故事")
    @PostMapping("/{storyId}/update")
    @Permission(StandardSubscriptionAuthority::class)
    open fun update(
        @ApiParam("故事ID") @PathVariable storyId: String,
        @RequestBody request: StoryUpdateRequest
    ): ResultDto<String> {
        storyService.updateStory(storyId, request)
        return ResultDto.success()
    }

    @ApiOperation("删除故事")
    @PostMapping("/{storyId}/delete")
    @Permission(StandardSubscriptionAuthority::class)
    open fun delete(@ApiParam("故事ID") @PathVariable storyId: String): ResultDto<String> {
        storyService.deleteStory(storyId)
        return ResultDto.success()
    }
}
