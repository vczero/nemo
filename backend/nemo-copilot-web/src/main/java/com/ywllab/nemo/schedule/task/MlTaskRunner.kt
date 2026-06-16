package com.ywllab.nemo.schedule.task

import cn.hutool.http.HttpRequest
import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSON
import com.ywllab.nemo.dto.compute.ml.MlComputeResponseDto
import com.ywllab.nemo.model.compute.ComputeEndpoint
import com.ywllab.nemo.model.compute.ComputeTask
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.net.SocketTimeoutException

/**
 * ML模型任务执行器
 * 处理非LLM的计算任务（如分词统计、情感计算等）
 */
@Service
open class MlTaskRunner : ComputeTaskRunner() {
    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * 执行ML模型任务
     */
    open fun executeTask(task: ComputeTask, endpoint: ComputeEndpoint) {
        try {
            beforeExecute(task, endpoint)

            // 构建请求
            val bodyStr = JSONUtil.toJsonStr(task.taskParams)
            val httpResponse = HttpRequest.post(endpoint.endpointUrl)
                .header("Content-Type", "application/json")
                .body(bodyStr)
                .timeout(endpoint.timeoutMs)
                .execute()

            val responseBody = httpResponse.body()
            if (!httpResponse.isOk || responseBody.isNullOrBlank()) {
                handleFailure(task, endpoint, "计算服务调用失败, HTTP ${httpResponse.status}")
                return
            }

            val mlResponse = JSON.parseObject(responseBody, MlComputeResponseDto::class.java)
            if (mlResponse.message == "OK") {
                if (mlResponse.data!!.files.isEmpty()) {
                    handleFailure(task, endpoint, "计算服务返回数据格式错误:$responseBody")
                    return
                }
                handleSuccess(task, endpoint, mlResponse.data!!)
            } else {
                handleFailure(task, endpoint, mlResponse.message ?: "计算服务返回错误:$responseBody")
            }
        } catch (e: SocketTimeoutException) {
            log.error("ML计算任务执行超时, taskId={}, msg={}", task.taskId, e.message, e)
            handleFailure(task, endpoint, "计算服务调用超时, ${e.message}")
        } catch (e: Throwable) {
            log.error("ML计算任务执行异常, taskId={}, msg={}", task.taskId, e.message, e)
            handleFailure(task, endpoint, "计算任务执行异常: ${e.message}")
        }
    }

    /**
     * 处理任务结果（成功时调用）
     */
    override fun handleSuccess(
        task: ComputeTask,
        endpoint: ComputeEndpoint,
        resultData: Any?
    ) {
        val mlResult = resultData as? MlComputeResponseDto.MlComputeResultDto ?: return
        val now = System.currentTimeMillis()
        saveResultFiles(task, mlResult.files)
        // 存储 summary
        val summaryStr = JSON.toJSONString(mlResult.summary)
        markTaskSuccess(task, now, summaryStr)
        log.info("ML计算任务执行成功, taskId={}", task.taskId)
    }
}
