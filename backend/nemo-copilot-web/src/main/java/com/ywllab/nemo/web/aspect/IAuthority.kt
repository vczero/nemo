package com.ywllab.nemo.web.aspect

import com.ywllab.nemo.annotation.Permission
import org.aspectj.lang.ProceedingJoinPoint

interface IAuthority {

    fun getUserId(): String?

    fun auth(userId: String?, annotation: Permission, joinPoint: ProceedingJoinPoint): Any?
}
