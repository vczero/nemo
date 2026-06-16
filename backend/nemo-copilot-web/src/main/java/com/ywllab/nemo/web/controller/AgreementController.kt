package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.agreement.AgreementUrlResponse
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.service.AgreementService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.servlet.http.HttpServletResponse

@Api(tags = ["用户协议"])
@RestController
@RequestMapping("/api/agreement")
open class AgreementController {
    private val log = LoggerFactory.getLogger(javaClass)

    @Autowired
    private lateinit var agreementService: AgreementService

    @ApiOperation("获取最新协议列表")
    @GetMapping("/latest")
    open fun getLatest(): ResultDto<List<AgreementUrlResponse>> {
        val response = agreementService.getLatestAgreements()
        return ResultDto.success(response)
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
        } catch (e: NotFoundException) {
            response.status = HttpStatus.NOT_FOUND.value()
            log.warn("预览协议不存在, agreementId={}", agreementId)
        } catch (e: Throwable) {
            response.status = HttpStatus.INTERNAL_SERVER_ERROR.value()
            log.error("预览协议失败, agreementId={}, error={}", agreementId, e.message, e)
        }
    }
}
