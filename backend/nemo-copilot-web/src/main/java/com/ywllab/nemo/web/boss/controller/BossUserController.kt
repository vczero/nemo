package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.PointsRecordType
import com.ywllab.nemo.constant.SubscriptionStatus
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.account.BossPointsStatisticsResponse
import com.ywllab.nemo.dto.account.PointsAdjustRequest
import com.ywllab.nemo.dto.account.PointsRecordPageRequest
import com.ywllab.nemo.dto.account.PointsRecordResponse
import com.ywllab.nemo.dto.user.BossUserDetail
import com.ywllab.nemo.dto.user.BossUserRelationRequest
import com.ywllab.nemo.dto.user.LoginParam
import com.ywllab.nemo.dto.user.UserEmailQueryResponse
import com.ywllab.nemo.dto.user.UserSession
import com.ywllab.nemo.exception.IllegalAccess
import com.ywllab.nemo.model.BossUserRelation
import com.ywllab.nemo.model.User
import com.ywllab.nemo.model.UserAccount
import com.ywllab.nemo.service.BossUserService
import com.ywllab.nemo.service.UserAccountService
import com.ywllab.nemo.service.UserService
import com.ywllab.nemo.service.UserSessionHelper
import com.ywllab.nemo.util.CryptoUtil
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import javax.servlet.http.HttpSession

@Api(tags = ["BOSS-用户"])
@RestController
@RequestMapping("/boss/api/user")
open class BossUserController {

    @Autowired
    private lateinit var userService: UserService

    @Autowired
    private lateinit var userAccountService: UserAccountService

    @Autowired
    private lateinit var bossUserService: BossUserService

    @ApiOperation("用户登录")
    @PostMapping("/login")
    open fun login(
        @RequestBody param: LoginParam,
        session: HttpSession
    ): ResultDto<UserSession> {
        param.password = CryptoUtil.encrypt(param.password!!)
        val userSession = userService.login(param)

        // 检查用户是否在boss用户关联表中
        if (!bossUserService.hasBossAccess(userSession.userId)) {
            throw IllegalAccess()
        }

        return ResultDto.success(userSession)
    }

    @ApiOperation("用户登出")
    @PostMapping("/logout")
    open fun logout(session: HttpSession): ResultDto<String> {
        userService.logout(session)
        return ResultDto.success("登出成功")
    }

    @ApiOperation("获取当前登录用户信息")
    @GetMapping("/current")
    open fun getCurrentUser(session: HttpSession): ResultDto<UserSession> {
        val userSession = UserSessionHelper.getUserSession()
        return ResultDto.success(userSession)
    }

    @ApiOperation("用户列表")
    @GetMapping("/list")
    open fun list(
        @RequestParam(required = false) keyword: String?,
        @RequestParam(required = false) role: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(defaultValue = "1") pageNum: Int,
        @RequestParam(defaultValue = "20") pageSize: Int
    ): ResultDto<PageResultDto<User>> {
        val result = userService.listUsers(keyword, status, pageNum, pageSize)
        // 清除密码字段，不返回给前端
        result.list.forEach { it.password = "" }
        return ResultDto.success(result)
    }

    @ApiOperation("获取用户详情")
    @GetMapping("/{userId}")
    open fun getUserDetail(@PathVariable userId: String): ResultDto<BossUserDetail> {
        val response = userService.getUserDetail(userId)!!
        return ResultDto.success(response)
    }

    @ApiOperation("更新用户信息")
    @PostMapping("/update")
    open fun update(@RequestBody user: User): ResultDto<String> {
        userService.updateUser(user)
        return ResultDto.success("更新成功")
    }

    @ApiOperation("重置密码（管理员）")
    @PostMapping("/reset-password")
    open fun resetPassword(
        @RequestParam userId: String,
        @RequestParam newPassword: String
    ): ResultDto<String> {
        userService.resetPassword(userId, newPassword)
        return ResultDto.success("密码重置成功")
    }

    @ApiOperation("获取用户账户信息")
    @GetMapping("/{userId}/account")
    open fun getUserAccount(@PathVariable userId: String): ResultDto<UserAccount> {
        val response = userAccountService.getAccountByUserId(userId)!!
        return ResultDto.success(response)
    }

    @ApiOperation("获取用户积分统计")
    @GetMapping("/{userId}/points/statistics")
    open fun getPointsStatistics(@PathVariable userId: String): ResultDto<BossPointsStatisticsResponse> {
        val statistics = userAccountService.getPointsStatistics(userId)
        return ResultDto.success(statistics)
    }

    @ApiOperation("调整用户积分")
    @PostMapping("/{userId}/points/adjust")
    open fun adjustUserPoints(
        @PathVariable userId: String,
        @RequestBody request: PointsAdjustRequest
    ): ResultDto<Nothing> {
        val account = userAccountService.getAccountByUserId(userId)!!
        val operator = UserSessionHelper.getUsername()
        userAccountService.adjustPoints(account.accountId, request.points, request.remark, operator)
        return ResultDto.success()
    }

    @ApiOperation("获取用户积分记录")
    @GetMapping("/{userId}/points/records")
    open fun getUserPointsRecords(
        @PathVariable userId: String,
        @RequestParam(required = false) type: PointsRecordType?,
        @RequestParam(defaultValue = "1") pageNum: Int,
        @RequestParam(defaultValue = "20") pageSize: Int
    ): ResultDto<PageResultDto<PointsRecordResponse>> {
        val account = userAccountService.getAccountByUserId(userId)!!

        val request = PointsRecordPageRequest().apply {
            this.type = type
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }

        val (list, total) = userAccountService.listPointsRecords(account.accountId, request)
        val result = PageResultDto(list, total, pageNum.toLong(), pageSize.toLong())
        return ResultDto.success(result)
    }

    @ApiOperation("获取用户积分消费明细（支持时间范围筛选）")
    @GetMapping("/{userId}/points/records/detailed")
    open fun getUserPointsRecordsDetailed(
        @PathVariable userId: String,
        @RequestParam(required = false) type: PointsRecordType?,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?,
        @RequestParam(defaultValue = "1") pageNum: Int,
        @RequestParam(defaultValue = "20") pageSize: Int
    ): ResultDto<PageResultDto<PointsRecordResponse>> {
        val (list, total) = userAccountService.getUserPointsRecordsDetailed(
            userId, type, startDate, endDate, pageNum, pageSize
        )
        val result = PageResultDto(list, total, pageNum.toLong(), pageSize.toLong())
        return ResultDto.success(result)
    }

    @ApiOperation("Boss用户关联列表")
    @GetMapping("/relation/list")
    open fun listBossUserRelations(): ResultDto<List<BossUserRelation>> {
        val relations = bossUserService.listBossUserRelations()
        return ResultDto.success(relations)
    }

    @ApiOperation("新增Boss用户关联")
    @PostMapping("/relation/create")
    open fun createBossUserRelation(@RequestBody request: BossUserRelationRequest): ResultDto<String> {
        val message = bossUserService.createBossUserRelation(request)
        return ResultDto.success(message)
    }

    @ApiOperation("更新Boss用户关联")
    @PostMapping("/relation/update")
    open fun updateBossUserRelation(@RequestBody request: BossUserRelationRequest): ResultDto<String> {
        val message = bossUserService.updateBossUserRelation(request)
        return ResultDto.success(message)
    }

    @ApiOperation("删除Boss用户关联")
    @PostMapping("/relation/delete")
    open fun deleteBossUserRelation(@RequestParam userId: String): ResultDto<String> {
        bossUserService.deleteBossUserRelation(userId)
        return ResultDto.success("删除成功")
    }

    @ApiOperation("根据邮箱查询用户")
    @GetMapping("/find-by-email")
    open fun findUserByEmail(@RequestParam email: String): ResultDto<UserEmailQueryResponse> {
        val user = userService.getByEmail(email)
            ?: return ResultDto.success(
                UserEmailQueryResponse().apply {
                    this.exists = false
                }
            )
        val accountInfo = userAccountService.getAccountInfo(user.userId)
        return ResultDto.success(
            UserEmailQueryResponse().apply {
                this.exists = true
                this.username = user.username
                this.nickname = user.nickname
                this.subscriptionEndTime = accountInfo?.subscriptionEndTime
                this.subscriptionStatus = accountInfo?.subscriptionStatus ?: SubscriptionStatus.NONE
            }
        )
    }
}
