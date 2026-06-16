package com.ywllab.nemo.schedule

import com.ywllab.nemo.dao.OrderDao
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
open class TokenPackSchedule {
    val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 每天0点检查过期流量包
     */
    @Scheduled(cron = "0 0 0 * * ?")
    open fun updateExpiredTokenPacks() {
        logger.info("开始检查过期流量包...")
        try {
            val updated = OrderDao.updateExpiredTokenPacks()
            logger.info("过期流量包更新完成，共更新 $updated 条记录")
        } catch (e: Exception) {
            logger.error("更新过期流量包失败", e)
        }
    }
}
