package com.ywllab.nemo.web.aspect

import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.exception.BizException
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Pointcut
import org.slf4j.LoggerFactory
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes

@Aspect
@Component
@Order(0)
open class WebLogAspect {

    private val log = LoggerFactory.getLogger(javaClass)

    @Pointcut("execution(public * com.ywllab.nemo.web.controller..*(..))")
    open fun logPointCut() {
    }

    @Pointcut("execution(public * com.ywllab.nemo.web.boss.controller..*(..))")
    open fun bossLogPointCut() {
    }

    @Around("logPointCut() || bossLogPointCut()")
    open fun doAround(joinPoint: ProceedingJoinPoint): Any? {
        val message = StringBuilder()
        try {
            val request = (RequestContextHolder.getRequestAttributes() as ServletRequestAttributes).request
            message.append("${request.method} ${request.requestURI}")
        } catch (ex: Throwable) {
        }
        // 打印耗时或错误
        val startTime = System.currentTimeMillis()
        return try {
            val result = joinPoint.proceed()
            message.append(" - SUCCESS ${System.currentTimeMillis() - startTime}ms")
            result
        } catch (e: Throwable) {
            message.append(" - ERROR ${System.currentTimeMillis() - startTime}ms")
            if (e is BizException) {
                log.info("接口调用异常: ${e.message}", e)
                ResultDto.fail<Any>(e.message ?: e.javaClass.name, e.code)
            } else {
                log.error(e.message ?: e.javaClass.name, e)
                ResultDto.fail(e.message ?: e.javaClass.name)
            }
        } finally {
            log.info(message.toString())
        }
    }
}
