package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.agreement.AgreementCreateRequest
import com.ywllab.nemo.dto.agreement.AgreementPageRequest
import com.ywllab.nemo.dto.agreement.AgreementPageResponse
import com.ywllab.nemo.dto.agreement.AgreementResponse
import com.ywllab.nemo.dto.agreement.UserAgreementPageRequest
import com.ywllab.nemo.dto.agreement.UserAgreementPageResponse
import com.ywllab.nemo.service.AgreementService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import javax.servlet.http.HttpServletResponse

@Api(tags = ["BOSS-协议管理"])
@RestController
@RequestMapping("/boss/api/agreements")
open class BossAgreementController {
    private val log = LoggerFactory.getLogger(javaClass)

    @Autowired
    private lateinit var agreementService: AgreementService

    @ApiOperation("协议列表分页查询")
    @PostMapping("/page")
    open fun page(@RequestBody request: AgreementPageRequest): ResultDto<PageResultDto<AgreementPageResponse>> {
        return ResultDto.success(agreementService.listAgreements(request))
    }

    @ApiOperation("获取协议详情")
    @GetMapping("/detail")
    open fun detail(@RequestParam agreementId: String): ResultDto<AgreementResponse> {
        val response = agreementService.getAgreementById(agreementId)
        return ResultDto.success(response)
    }

    @ApiOperation("创建协议")
    @PostMapping("/create")
    open fun create(@RequestBody request: AgreementCreateRequest): ResultDto<String> {
        val agreementId = agreementService.createAgreement(request)
        return ResultDto.success(agreementId)
    }

    @ApiOperation("激活协议")
    @PostMapping("/activate")
    open fun activate(
        @RequestParam agreementId: String,
        @RequestParam(required = false) effectiveDate: Long?
    ): ResultDto<String> {
        val resultId = agreementService.activateAgreement(agreementId, effectiveDate)
        return ResultDto.success(resultId)
    }

    @ApiOperation("删除协议（仅未激活的协议可删除）")
    @PostMapping("/delete")
    open fun delete(@RequestParam agreementId: String): ResultDto<String> {
        val resultId = agreementService.deleteAgreement(agreementId)
        return ResultDto.success(resultId)
    }

    @ApiOperation("用户协议授权记录分页查询")
    @PostMapping("/user-agreements/page")
    open fun userAgreementsPage(@RequestBody request: UserAgreementPageRequest):
        ResultDto<PageResultDto<UserAgreementPageResponse>> {
            return ResultDto.success(agreementService.listUserAgreements(request))
        }

    @ApiOperation("预览协议内容")
    @GetMapping("/{agreementId}/preview")
    open fun preview(
        @PathVariable agreementId: String,
        response: HttpServletResponse
    ) {
        try {
            response.contentType = "text/html;charset=UTF-8"
            response.setHeader("Content-Disposition", "inline")
            val content = agreementService.getAgreementContentForPreview(agreementId)
            response.writer.write(content)
        } catch (e: Throwable) {
            response.status = HttpStatus.INTERNAL_SERVER_ERROR.value()
            log.error("预览协议失败, agreementId={}, error={}", agreementId, e.message, e)
        }
    }
}
