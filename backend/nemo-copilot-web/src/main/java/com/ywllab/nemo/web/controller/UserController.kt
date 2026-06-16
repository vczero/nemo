package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.user.ChangePasswordByCodeRequest
import com.ywllab.nemo.dto.user.ChangePasswordByPasswordRequest
import com.ywllab.nemo.dto.user.EmailRegisterRequest
import com.ywllab.nemo.dto.user.LoginParam
import com.ywllab.nemo.dto.user.UpdateEmailRequest
import com.ywllab.nemo.dto.user.UpdateUserRequest
import com.ywllab.nemo.dto.user.UserSession
import com.ywllab.nemo.service.UserService
import com.ywllab.nemo.service.UserSessionHelper
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpSession

@Api(tags = ["用户"])
@RestController
@RequestMapping("/api/user")
open class UserController {

    @Autowired
    lateinit var userService: UserService

    @ApiOperation("用户登录")
    @PostMapping("/login")
    open fun login(httpRequest: HttpServletRequest, @RequestBody param: LoginParam): ResultDto<UserSession> {
        val userSession = userService.login(httpRequest, param)
        return ResultDto.success(userSession)
    }

    @ApiOperation("用户注册")
    @PostMapping("/register-by-email")
    open fun register(
        httpRequest: HttpServletRequest,
        @RequestBody request: EmailRegisterRequest
    ): ResultDto<Nothing> {
        userService.createUser(httpRequest, request)
        return ResultDto.success()
    }

    @ApiOperation("用户登出")
    @PostMapping("/logout")
    open fun logout(session: HttpSession): ResultDto<Nothing> {
        userService.logout(session)
        return ResultDto.success()
    }

    @ApiOperation("获取当前登录用户信息")
    @GetMapping("/current")
    open fun getCurrentUser(session: HttpSession): ResultDto<UserSession> {
        val userSession = UserSessionHelper.getUserSession()
        return ResultDto.success(userSession)
    }

    @ApiOperation("更新用户信息")
    @PostMapping("/update")
    open fun update(@RequestBody request: UpdateUserRequest): ResultDto<Nothing> {
        userService.updateCurrentUser(request)
        return ResultDto.success()
    }

    @ApiOperation("更新用户头像")
    @PostMapping("/update-avatar")
    open fun updateAvatar(@ApiParam("文件") @RequestParam("file") file: MultipartFile): ResultDto<Nothing> {
        userService.updateAvatar(file)
        return ResultDto.success()
    }

    @ApiOperation("修改邮箱")
    @PostMapping("/update-email")
    open fun updateEmail(@RequestBody request: UpdateEmailRequest): ResultDto<Nothing> {
        userService.updateEmail(request)
        return ResultDto.success()
    }

    @ApiOperation("修改密码（通过旧密码）")
    @PostMapping("/change-password-by-password")
    open fun changePasswordByPassword(@RequestBody request: ChangePasswordByPasswordRequest):
        ResultDto<Nothing> {
            userService.changePasswordByPassword(request)
            return ResultDto.success()
        }

    @ApiOperation("修改密码（通过邮箱验证码）")
    @PostMapping("/change-password-by-code")
    open fun changePasswordByCode(@RequestBody request: ChangePasswordByCodeRequest):
        ResultDto<Nothing> {
            userService.changePasswordByCode(request)
            return ResultDto.success()
        }
}
