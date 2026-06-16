package com.ywllab.nemo.web.controller

import com.ywllab.nemo.annotation.Permission
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.agent.DataAgentRequest
import com.ywllab.nemo.dto.agent.SessionDetailDto
import com.ywllab.nemo.model.AgentSession
import com.ywllab.nemo.service.AgentService
import com.ywllab.nemo.service.AgentSessionService
import com.ywllab.nemo.util.SseUtil
import com.ywllab.nemo.web.aspect.StandardSubscriptionAuthority
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@Api(tags = ["智能体"])
@RestController
@RequestMapping("/api/agents")
open class AgentController {

    @Autowired
    lateinit var agentService: AgentService

    @Autowired
    lateinit var agentSessionService: AgentSessionService

    @ApiOperation("Create a model response")
    @PostMapping("/responses", produces = [MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_EVENT_STREAM_VALUE])
    @Permission(StandardSubscriptionAuthority::class)
    open fun responses(@RequestBody request: DataAgentRequest): SseEmitter {
        return SseUtil.createLlmSseEmitter { sseEmitter ->
            agentService.responses(request, sseEmitter)
        }
    }

    @ApiOperation("查询会话列表")
    @GetMapping("/session/list")
    @Permission(StandardSubscriptionAuthority::class)
    open fun listSession(): ResultDto<List<AgentSession>> {
        return ResultDto.success(agentSessionService.list())
    }

    @ApiOperation("查询会话详情（包含轮次列表）")
    @GetMapping("/session/{sessionId}/get")
    @Permission(StandardSubscriptionAuthority::class)
    open fun getSession(
        @ApiParam("会话ID") @PathVariable sessionId: String
    ): ResultDto<SessionDetailDto> {
        val dto = SessionDetailDto().apply {
            session = agentSessionService.get(sessionId)
            rounds = agentSessionService.listRoundLogs(sessionId)
        }
        return ResultDto.success(dto)
    }

    @ApiOperation("删除会话")
    @PostMapping("/session/{sessionId}/delete")
    @Permission(StandardSubscriptionAuthority::class)
    open fun deleteSession(
        @ApiParam("会话ID") @PathVariable sessionId: String
    ): ResultDto<String> {
        agentSessionService.delete(sessionId)
        return ResultDto.success()
    }
}
