package com.ywllab.nemo.schedule

import com.ywllab.nemo.dao.UserAccountDao
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

/**
 * 每月1号重置并发放订阅用户的月度token配额
 */
@Component
open class SubscriptionTokenSchedule {
    val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        const val OPERATOR_SYSTEM = "SYSTEM"
    }

    /**
     * 每月1号00:00重置并发放当月token配额
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    open fun resetAndGrantMonthlyTokens() {
        logger.info("开始月度订阅token发放重置...")
        try {
            val accounts = UserAccountDao.listActiveSubscriptionAccounts()
            var count = 0
            accounts.forEach { account ->
                if (account.subscribeTokenQuota > 0) {
                    // todo 新增token消耗记录
                    UserAccountDao.resetSubscribeTokenBalance(account.accountId, OPERATOR_SYSTEM)
                    count++
                    logger.info(
                        "月度token重置: accountId=${account.accountId}, " +
                            "quota=${account.subscribeTokenQuota}"
                    )
                }
            }
            logger.info("月度订阅token重置完成，共重置 $count 个账户")
        } catch (e: Exception) {
            logger.error("月度订阅token重置失败", e)
        }
    }
}
