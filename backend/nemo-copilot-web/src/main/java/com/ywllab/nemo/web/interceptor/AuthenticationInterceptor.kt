package com.ywllab.nemo.web.interceptor

import com.ywllab.nemo.dto.user.UserSession
import com.ywllab.nemo.exception.IllegalAccess
import com.ywllab.nemo.service.BossUserService
import com.ywllab.nemo.service.UserSessionHelper
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

/***
 * 注册发送验证码等接口应该跳过登录认证
 */
@Component
open class AuthenticationInterceptor : HandlerInterceptor {

    @Autowired
    private lateinit var bossUserService: BossUserService

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        val sessionAttr = request.getSession(false)?.getAttribute(UserSession.USER_SESSION)
        if (sessionAttr == null) {
            response.status = HttpServletResponse.SC_UNAUTHORIZED
        } else {
            if (request.requestURI.startsWith("/boss/api/")) {
                val userSession = UserSessionHelper.getUserSession()
                // 检查用户是否在boss用户关联表中
                if (!bossUserService.hasBossAccess(userSession.userId)) {
                    throw IllegalAccess()
                }
            }
        }
        return true
    }
}
