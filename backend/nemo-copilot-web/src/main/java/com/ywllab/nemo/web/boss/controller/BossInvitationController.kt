package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.invitation.InvitationCodePageRequest
import com.ywllab.nemo.dto.invitation.InvitationCodePageResponse
import com.ywllab.nemo.dto.invitation.InvitationRecordPageRequest
import com.ywllab.nemo.dto.invitation.InvitationRecordPageResponse
import com.ywllab.nemo.dto.invitation.InvitationStatisticsResponse
import com.ywllab.nemo.service.InvitationCodeService
import com.ywllab.nemo.service.InvitationService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-邀请码"])
@RestController
@RequestMapping("/boss/api/invitation")
open class BossInvitationController {

    @Autowired
    lateinit var invitationCodeService: InvitationCodeService

    @Autowired
    lateinit var invitationService: InvitationService

    @ApiOperation("邀请码列表分页查询")
    @PostMapping("/codes/page")
    open fun codesPage(@RequestBody request: InvitationCodePageRequest):
        ResultDto<PageResultDto<InvitationCodePageResponse>> {
            return ResultDto.success(invitationCodeService.listCodes(request))
        }

    @ApiOperation("邀请记录列表分页查询")
    @PostMapping("/records/page")
    open fun recordsPage(@RequestBody request: InvitationRecordPageRequest):
        ResultDto<PageResultDto<InvitationRecordPageResponse>> {
            return ResultDto.success(invitationService.listRecords(request))
        }

    @ApiOperation("邀请统计")
    @GetMapping("/statistics")
    open fun statistics(): ResultDto<InvitationStatisticsResponse> {
        val statistics = invitationCodeService.getStatistics()
        return ResultDto.success(statistics)
    }
}
