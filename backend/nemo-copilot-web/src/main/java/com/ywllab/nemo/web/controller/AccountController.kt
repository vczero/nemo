package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.account.PointsRecordPageRequest
import com.ywllab.nemo.dto.account.PointsRecordResponse
import com.ywllab.nemo.dto.account.UserSubscriptionPlanDto
import com.ywllab.nemo.dto.invitation.InvitationInfo
import com.ywllab.nemo.dto.invitation.PointAccountStats
import com.ywllab.nemo.service.InvitationService
import com.ywllab.nemo.service.UserAccountService
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["账户"])
@RestController
@RequestMapping("/api/account")
open class AccountController {

    @Autowired
    private lateinit var invitationService: InvitationService

    @Autowired
    lateinit var userAccountService: UserAccountService

    @ApiOperation("邀请码")
    @GetMapping("/invitation")
    open fun invitation(): ResultDto<InvitationInfo> {
        return ResultDto.success(invitationService.info(getUserId()))
    }

    @ApiOperation("订阅套餐")
    @GetMapping("/plan")
    open fun plan(): ResultDto<UserSubscriptionPlanDto> {
        val plan = userAccountService.getActivePlan(getUserId())
        return ResultDto.success(plan)
    }

    @ApiOperation("积分统计")
    @GetMapping("/points/stats")
    open fun pointsStats(): ResultDto<PointAccountStats> {
        val statistics = invitationService.getMyStatistics(getUserId())
        return ResultDto.success(statistics)
    }

    @ApiOperation("获取积分记录")
    @GetMapping("/points/page")
    open fun pointsPage(param: PageQuery): ResultDto<PageResultDto<PointsRecordResponse>> {
        val account = userAccountService.getAccountByUserId(getUserId())!!
        val request = PointsRecordPageRequest().apply {
            this.pageNum = param.pageNum
            this.pageSize = param.pageSize
            this.type = null
        }
        val (list, total) = userAccountService.listPointsRecords(account.accountId, request)
        return ResultDto(PageResultDto(list, total, param.pageNum, param.pageSize))
    }
}
