package com.ywllab.nemo.web.aspect

import com.ywllab.nemo.annotation.Permission
import com.ywllab.nemo.constant.SubscriptionStatus
import com.ywllab.nemo.exception.ExpiredSubscription
import com.ywllab.nemo.exception.NoSubscription
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.exception.SessionExpireException
import com.ywllab.nemo.service.UserAccountService
import com.ywllab.nemo.service.UserSessionHelper
import org.aspectj.lang.ProceedingJoinPoint
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class StandardSubscriptionAuthority : IAuthority {
    @Autowired
    lateinit var userAccountService: UserAccountService

    override fun auth(userId: String?, annotation: Permission, joinPoint: ProceedingJoinPoint): Any? {
        if (userId == null) {
            throw SessionExpireException()
        }
        val account = userAccountService.getAccountInfo(userId) ?: throw NotFoundException("账户不存在")
        if (account.subscriptionStatus == SubscriptionStatus.EXPIRED) {
            throw ExpiredSubscription()
        }
        if (account.subscriptionStatus == SubscriptionStatus.ACTIVE) {
            return null
        }
        throw NoSubscription()
    }

    override fun getUserId(): String {
        return UserSessionHelper.getUserId()
    }
}
