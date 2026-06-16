package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.AgentType
import com.ywllab.nemo.dao.AgentRoundLogDao
import com.ywllab.nemo.dao.AgentSessionDao
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.model.AgentRoundLog
import com.ywllab.nemo.model.AgentSession
import org.springframework.stereotype.Service

@Service
open class AgentSessionService {

    fun create(): AgentSession {
        val session = AgentSession().apply {
            this.sessionId = IdUtil.getSnowflakeNextIdStr()
            this.type = AgentType.DATA_AGENT
            this.title = "新会话"
            this.summary = ""
            this.queryNum = 0
            this.deleted = false
            this.userId = UserSessionHelper.getUserId()
            this.createBy = UserSessionHelper.getUserId()
            this.updateBy = UserSessionHelper.getUserId()
        }
        AgentSessionDao.insert(session)
        return session
    }

    fun get(sessionId: String): AgentSession {
        return AgentSessionDao.getBySessionId(sessionId)
            ?: throw BizException("会话不存在")
    }

    fun list(): List<AgentSession> {
        return AgentSessionDao.listSessions(UserSessionHelper.getUserId())
    }

    fun delete(sessionId: String) {
        AgentSessionDao.softDelete(sessionId)
    }

    fun updateSummary(sessionId: String, summary: String, queryNum: Int, userId: String) {
        AgentSessionDao.updateSummary(sessionId, summary, queryNum, userId)
    }

    fun addRoundLog(
        sessionId: String,
        role: String,
        content: String,
        createUserId: String,
        parentId: String = "",
        fileIdList: List<String> = emptyList(),
        spendTime: Int = 0,
    ): AgentRoundLog {
        get(sessionId)
        val roundLog = AgentRoundLog().apply {
            this.id = AgentRoundLogDao.createId()
            this.sessionId = sessionId
            this.role = role
            this.content = content
            this.parentId = parentId
            this.fileIdList = fileIdList
            this.spendTime = spendTime
            this.toolCallResult = "[]"
            this.createBy = createUserId
            this.updateBy = createUserId
        }
        AgentRoundLogDao.insert(roundLog)
        return roundLog
    }

    fun listRoundLogs(sessionId: String): List<AgentRoundLog> {
        get(sessionId)
        return AgentRoundLogDao.listBySessionId(sessionId)
    }
}
