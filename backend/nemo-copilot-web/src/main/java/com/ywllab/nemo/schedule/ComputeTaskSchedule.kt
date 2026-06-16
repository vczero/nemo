package com.ywllab.nemo.schedule

import cn.hutool.core.net.NetUtil
import cn.hutool.core.thread.NamedThreadFactory
import com.ywllab.nemo.constant.ExecCategory
import com.ywllab.nemo.dao.ComputeEndpointDao
import com.ywllab.nemo.dao.ComputeTaskDao
import com.ywllab.nemo.schedule.task.LlmTaskRunner
import com.ywllab.nemo.schedule.task.MlTaskRunner
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import javax.annotation.PostConstruct

@Component
open class ComputeTaskSchedule {
    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        const val WORKER_THREAD_NAME = "ComputeTaskWorker"
    }

    @Autowired
    private lateinit var llmTaskRunner: LlmTaskRunner

    @Autowired
    private lateinit var mlTaskRunner: MlTaskRunner

    // 并行执行线程数
    @Value("\${app.compute-task-parallel:1}")
    private val parallel: Int = 1

    // 工作线程
    private var taskPool = ThreadPoolExecutor(
        0, 1, 0L, TimeUnit.MILLISECONDS, LinkedBlockingQueue(),
        NamedThreadFactory(WORKER_THREAD_NAME, false)
    )

    val workerHost: String = NetUtil.getLocalHostName()

    /**
     * 启动时将本节点 RUNNING 状态的任务重置为 PENDING
     * （节点重启/崩溃后，之前正在执行的任务需要重新调度）
     */
    @PostConstruct
    fun resetRunningTasksOnStartup() {
        try {
            taskPool = ThreadPoolExecutor(
                parallel, parallel, 0L, TimeUnit.SECONDS, LinkedBlockingQueue(),
                NamedThreadFactory("task-", false)
            )
            val count = ComputeTaskDao.resetRunningToPending(workerHost)
            if (count > 0) {
                log.warn("节点启动，重置 {} 个 RUNNING 任务为 PENDING, workerHost={}", count, workerHost)
            } else {
                log.info("节点启动，无 RUNNING 任务需要重置, workerHost={}", workerHost)
            }
        } catch (e: Exception) {
            log.error("重置 RUNNING 任务异常, workerHost={}", workerHost, e)
        }
    }

    /**
     * 每秒轮询一次待处理的计算任务
     */
    @Scheduled(fixedDelay = 1000, initialDelay = 10_000)
    open fun pollPendingTasks() {
        if (taskPool.activeCount >= parallel) {
            return
        }
        try {
            // 优先取本节点的重试任务，其次取未分配的新任务
            val taskId = ComputeTaskDao.nextPendingTask(workerHost) ?: return
            val task = ComputeTaskDao.getByTaskId(taskId) ?: run {
                log.warn("任务不存在, taskId={}", taskId)
                return
            }
            // 并发限制：同用户同服务类型 RUNNING 不超过 1 个
            val runningCount = ComputeTaskDao.countRunningByUserAndEndpointType(task.userId, task.endpointType)
            if (runningCount >= 5) {
                log.info("并发受限，跳过调度, userId=${task.userId}, runningCount=$runningCount")
                return
            }

            // 执行时再获取可用端点（defer endpoint lookup to execution time）
            val endpoint = ComputeEndpointDao.getActiveByEndpointType(task.endpointType)
            if (endpoint == null) {
                // 无可用服务，标记失败
                ComputeTaskDao.markFailed(taskId, "SYSTEM", "${task.endpointType}无可用计算服务")
                log.warn("无可用计算服务, taskId={}, endpointType={}", taskId, task.endpointType)
                return
            }
            // 乐观锁抢占，同时设置endpointId和workerHost（首次claim设值，重试时保持原值）
            val claimed = ComputeTaskDao.claimTask(taskId, endpoint.endpointId, workerHost)
            if (!claimed) {
                log.info("任务抢占失败（可能被其他节点抢占），跳过, taskId={}", taskId)
                return
            }

            log.info(
                "抢占计算任务成功, taskId={}, userId={}, endpointType={}, endpointId={}, workerHost={}",
                taskId, task.userId, task.endpointType, endpoint.endpointId, workerHost
            )
            log.info("计算任务，queue={},active={},max={}", taskPool.queue.size, taskPool.activeCount, parallel)

            taskPool.submit {
                try {
                    log.debug("任务开始执行, taskId={}, workerHost={}", taskId, workerHost)
                    when (endpoint.execCategory) {
                        ExecCategory.LLM -> llmTaskRunner.executeTask(task, endpoint)
                        ExecCategory.ML_MODEL -> mlTaskRunner.executeTask(task, endpoint)
                    }
                } catch (e: Exception) {
                    log.error("计算任务执行异常, taskId={}, workerHost={}", taskId, workerHost, e)
                }
            }
        } catch (e: Exception) {
            log.error("计算任务调度异常", e)
        }
    }
}
