package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import cn.hutool.json.JSONObject
import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSON
import com.ywllab.nemo.constant.ComputeType
import com.ywllab.nemo.dao.AgentRoundLogDao
import com.ywllab.nemo.dao.ComputeEndpointDao
import com.ywllab.nemo.dao.FileDao
import com.ywllab.nemo.dao.LlmLogDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dto.agent.DataAgentRequest
import com.ywllab.nemo.dto.compute.openai.ResponseCompletedEvent
import com.ywllab.nemo.dto.compute.openai.ResponseData
import com.ywllab.nemo.dto.compute.openai.ResponseOutputTextDoneEvent
import com.ywllab.nemo.dto.compute.openai.ResponseParam
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.SystemException
import com.ywllab.nemo.model.LlmLog
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import com.ywllab.nemo.service.UserSessionHelper.getUsername
import com.ywllab.nemo.util.ChartUtil
import com.ywllab.nemo.util.SseUtil
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@Service
open class AgentService {
    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private const val MAX_CONTEXT_ROUNDS = 10
    }

    @Autowired
    lateinit var jwtService: JwtService

    @Autowired
    lateinit var tokenPackService: TokenPackService

    @Autowired
    lateinit var ossService: OssService

    @Autowired
    lateinit var agentSessionService: AgentSessionService

    fun responses(request: DataAgentRequest, sseEmitter: SseEmitter) {
        val session = if (request.sessionId.isBlank()) {
            val session = agentSessionService.create()
            request.sessionId = session.sessionId
            session
        } else {
            agentSessionService.get(request.sessionId)
        }
        // 如果sessionId存在但fileIds为空，从历史记录中获取文件ID
        if (request.sessionId.isNotBlank() && request.fileIds.isEmpty()) {
            val lastUserLog = agentSessionService.listRoundLogs(request.sessionId)
                .filter { it.role == "user" }
                .lastOrNull()
            if (lastUserLog != null && lastUserLog.fileIdList.isNotEmpty()) {
                request.fileIds = lastUserLog.fileIdList
            }
        }
        val userId = getUserId()
        // check balance
        val accountId = checkAccount(userId)
        // determine current input and build messages
        val (currentInput, messagesForApi) = buildMessages(request, session.sessionId)

        // save user round log
        val userRoundLog = agentSessionService.addRoundLog(
            sessionId = session.sessionId,
            role = "user",
            content = currentInput,
            createUserId = userId,
            fileIdList = request.fileIds
        )

        // create assistant round log upfront with empty content
        val assistantRoundLog = agentSessionService.addRoundLog(
            sessionId = session.sessionId,
            role = "assistant",
            content = "",
            createUserId = userId,
            parentId = userRoundLog.id
        )

        // send session_create event with session_id and assistant_round_id
        val sessionCreateEvent = ResponseOutputTextDoneEvent().apply {
            itemId = "session_create"
            text = session.sessionId
            sequenceNumber = 0
        }
        SseUtil.send(sseEmitter, JSON.toJSONString(sessionCreateEvent))

        val endpoint = ComputeEndpointDao.getActiveByEndpointType(ComputeType.DATA_AGENT)
            ?: throw SystemException("系统尚未配置DataAgent服务")

        val allHeaders = endpoint.headers?.toMutableMap() ?: mutableMapOf()
        allHeaders["Authorization"] = jwtService.generateToken(userId, getUsername())

        // build input for API
        val modelParam = buildModelParam(currentInput, messagesForApi)
        val fileId = request.fileIds.firstOrNull()
        if (fileId != null && messagesForApi.isEmpty()) {
            modelParam["file_id"] = fileId
            modelParam["file_path"] = FileDao.get(fileId)!!.ossPath
        }

        val llmConfig = endpoint.llmServiceConfig ?: emptyMap()
        val param = ResponseParam().apply {
            model = llmConfig["model"]?.toString()
            temperature = llmConfig["temperature"]?.toString()?.toDouble()
            instructions = llmConfig["instructions"]?.toString()
            input = modelParam
        }

        // create llm log
        val messageId = IdUtil.getSnowflakeNextIdStr()
        val llmLog = LlmLog().apply {
            logId = messageId
            bizType = ComputeType.DATA_AGENT
            this.bizId = session.sessionId
            this.userId = userId
            this.accountId = accountId
            this.url = endpoint.endpointUrl
            model = param.model ?: ""
            inputContent = JSONUtil.toJsonStr(param)
            createBy = userId
        }
        LlmLogDao.create(llmLog)

        val startTime = System.currentTimeMillis()
        val toolResults = mutableListOf<JSONObject>()
        try {
            ChartUtil.streamResponseCompletion(
                url = endpoint.endpointUrl,
                param = param,
                onNext = { event ->
                    val jsonStr = JSONUtil.toJsonStr(event)
                    if (jsonStr.isNotBlank() && jsonStr != "{}") {
                        SseUtil.send(sseEmitter, jsonStr)
                        // 解析 SSE 事件，提取 function_call 和 tool results
                        parseSseEvent(jsonStr, toolResults)
                    }
                },
                onError = { error ->
                    log.error("DataAgent streaming error: {}", error.message)
                    SseUtil.sendError(sseEmitter, error.message ?: "Unknown error")
                    sseEmitter.complete()
                },
                onComplete = { event ->
                    if (event is ResponseCompletedEvent) {
                        // update assistant round log with content and tool results
                        val spendTime = (System.currentTimeMillis() - startTime).toInt()
                        val assistantContent = extractOutputText(event.response)
                        AgentRoundLogDao.updateContent(assistantRoundLog.id, assistantContent)
                        if (toolResults.isNotEmpty()) {
                            AgentRoundLogDao.updateToolResults(assistantRoundLog.id, JSONUtil.toJsonStr(toolResults))
                        }
                        // generate summary if empty
                        if (session.summary.isBlank()) {
                            session.summary = generateSummary(currentInput, assistantContent)
                        }
                        session.queryNum += 1
                        agentSessionService.updateSummary(session.sessionId, session.summary, session.queryNum, userId)

                        // update llm log
                        val completedLog = llmLog.also {
                            it.outputContent = JSONUtil.toJsonStr(event.response)
                            it.inputTokenCount = event.response?.usage?.inputTokens
                            it.outputTokenCount = event.response?.usage?.outputTokens
                            it.totalTokenCount = event.response?.usage?.totalTokens
                        }
                        LlmLogDao.update(completedLog)
                        // deduct token
                        val totalTokens = event.response?.usage?.totalTokens ?: 0
                        if (totalTokens > 0) {
                            tokenPackService.deductToken(
                                accountId,
                                totalTokens.toLong(),
                                ComputeType.DATA_AGENT,
                                session.sessionId
                            )
                        }
                    }
                    sseEmitter.complete()
                },
                headerMap = allHeaders
            )
        } catch (e: Exception) {
            log.error("DataAgent streaming error", e)
            SseUtil.sendError(sseEmitter, e.message ?: "Unknown error")
            sseEmitter.complete()
        }
    }

    private fun checkAccount(userId: String): String {
        val account = UserAccountDao.getByUserId(userId)
            ?: throw BizException("用户账户不存在")
        // pass
//        if (account.tokenBalance + account.subscribeTokenBalance <= 0) {
//            throw BusinessException("账户余额不足")
//        }
        val accountId = account.accountId
        return accountId
    }

    /**
     * 构建消息列表
     * @return Pair(first: 当前输入, second: 历史消息列表用于API)
     */
    private fun buildMessages(request: DataAgentRequest, sessionId: String): Pair<String, List<Map<String, Any>>> {
        val input = request.input
        return if (input is List<*>) {
            // 多轮对话: input是数组 [history1, history2, ..., currentInput]
            @Suppress("UNCHECKED_CAST")
            val inputList = input as List<String>
            if (inputList.isEmpty()) {
                throw BizException("输入不能为空")
            }
            val currentInput = inputList.last()
            // 获取历史round logs并构建messages
            val historyLogs = agentSessionService.listRoundLogs(sessionId)
                .takeLast(MAX_CONTEXT_ROUNDS * 2) // user + assistant = 2 per round
                .reversed()

            val messages = mutableListOf<Map<String, Any>>()
            for (log in historyLogs) {
                messages.add(mapOf("role" to log.role, "content" to log.content))
            }
            // 添加当前输入作为最后一条user消息
            messages.add(mapOf("role" to "user", "content" to currentInput))
            Pair(currentInput, messages)
        } else {
            // 单轮对话
            val currentInput = input.toString()
            Pair(currentInput, emptyList())
        }
    }

    private fun buildModelParam(currentInput: String, messages: List<Map<String, Any>>): MutableMap<String, Any> {
        return if (messages.isEmpty()) {
            mutableMapOf("input" to currentInput)
        } else {
            mutableMapOf("input" to messages)
        }
    }

    private fun extractOutputText(response: ResponseData?): String {
        if (response == null) return ""
        return response.output
            ?.firstOrNull { it.type == "message" }
            ?.content
            ?.firstOrNull { it.type == "output_text" }
            ?.text
            ?: ""
    }

    private fun parseSseEvent(jsonStr: String, toolResults: MutableList<JSONObject>) {
        try {
            val obj = JSON.parseObject(jsonStr)
            val type = obj.getString("type") ?: return

            // 解析 output_item.done 事件中的 tool result
            if (type == "response.output_item.done") {
                val item = obj.getJSONObject("item") ?: return
                val role = item.getString("role")
                if (role != "tool") return

                toolResults.add(JSONUtil.parseObj(jsonStr))
                log.info("Collected raw tool result event")
            }
        } catch (e: Exception) {
            log.warn("Failed to parse SSE event: {}", e.message)
        }
    }

    private fun generateSummary(userMessage: String, assistantMessage: String): String {
        return if (userMessage.length > 50) {
            userMessage.take(50) + "..."
        } else {
            userMessage
        }
    }
}
