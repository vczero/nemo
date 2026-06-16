package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.web.SendCodeRequest
import com.ywllab.nemo.dto.web.VerifyCodeRequest
import com.ywllab.nemo.service.EmailService
import com.ywllab.nemo.util.ClientIpUtil
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.servlet.http.HttpServletRequest
import javax.validation.Valid

@Api(tags = ["邮箱验证"])
@RestController
@RequestMapping("/api/email")
open class EmailController {

    @Autowired
    lateinit var emailService: EmailService

    @ApiOperation("发送验证码")
    @PostMapping("/send-register-code")
    open fun sendRegisterCode(
        @RequestBody @Valid request: SendCodeRequest,
        httpRequest: HttpServletRequest
    ): ResultDto<String> {
        val ip = ClientIpUtil.getClientIp(httpRequest)
        emailService.sendVerificationCode(request.email, request.type, ip)
        return ResultDto.success("验证码已发送")
    }

    @ApiOperation("验证验证码")
    @PostMapping("/verify-code")
    open fun verifyCode(@RequestBody @Valid request: VerifyCodeRequest): ResultDto<Boolean> {
        val isValid = emailService.verifyCodeAndMark(request.email, request.code, request.type)
        return ResultDto.success(isValid)
    }
}
