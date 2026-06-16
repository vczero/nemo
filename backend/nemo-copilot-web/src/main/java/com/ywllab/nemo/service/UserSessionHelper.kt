package com.ywllab.nemo.service

import com.ywllab.nemo.dto.user.UserSession
import com.ywllab.nemo.exception.BizException
import org.springframework.web.context.request.RequestAttributes
import org.springframework.web.context.request.RequestContextHolder

object UserSessionHelper {
    private var threadLocalSessionContext = ThreadLocal<UserSession>()

    fun setSessionContext(session: UserSession) {
        threadLocalSessionContext.set(session)
    }

    private fun getSessionContext(): UserSession? {
        return threadLocalSessionContext.get()
    }

    fun getUserSession(): UserSession {
        try {
            return RequestContextHolder.currentRequestAttributes().getAttribute(
                UserSession.USER_SESSION,
                RequestAttributes.SCOPE_SESSION
            ) as UserSession
        } catch (e: Throwable) {
            throw BizException("会话已过期，请重新登录")
        }
    }

    fun setUserSession(userSession: UserSession) {
        RequestContextHolder.currentRequestAttributes().setAttribute(
            UserSession.USER_SESSION,
            userSession,
            RequestAttributes.SCOPE_SESSION
        )
    }

    fun getUsername(): String {
        val session = try {
            getSessionContext() ?: getUserSession()
        } catch (e: Throwable) {
            null
        }
        return session?.username ?: throw BizException("会话已过期")
    }

    fun getUserId(): String {
        val session = try {
            getSessionContext() ?: getUserSession()
        } catch (e: Throwable) {
            null
        }
        return session?.userId ?: throw BizException("会话已过期")
    }
}
