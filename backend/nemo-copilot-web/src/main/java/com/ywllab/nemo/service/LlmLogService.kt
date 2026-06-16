package com.ywllab.nemo.service

import cn.hutool.json.JSONUtil
import com.ywllab.nemo.dao.LlmLogDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.llm.LlmLogDetailDto
import com.ywllab.nemo.dto.llm.LlmLogListDto
import com.ywllab.nemo.dto.llm.LlmLogPageQuery
import com.ywllab.nemo.exception.NotFoundException
import org.springframework.stereotype.Service

@Service
open class LlmLogService {

    open fun pageLogs(query: LlmLogPageQuery): PageResultDto<LlmLogListDto> {
        val (list, total) = LlmLogDao.page(query)
        val dtoList = list.map { toListDto(it) }
        return PageResultDto(dtoList, total, query.pageNum, query.pageSize)
    }

    open fun getLogDetail(logId: String): LlmLogDetailDto {
        val llmLog = LlmLogDao.getByLogId(logId) ?: throw NotFoundException("日志不存在")
        return toDetailDto(llmLog)
    }

    private fun toListDto(llmLog: com.ywllab.nemo.model.LlmLog): LlmLogListDto {
        val user = UserDao.getById(llmLog.userId)
        return LlmLogListDto().apply {
            logId = llmLog.logId
            bizType = llmLog.bizType
            bizId = llmLog.bizId
            userId = llmLog.userId
            username = user?.username
            accountId = llmLog.accountId
            model = llmLog.model
            inputTokenCount = llmLog.inputTokenCount
            outputTokenCount = llmLog.outputTokenCount
            totalTokenCount = llmLog.totalTokenCount
            createTime = llmLog.createTime
            createBy = llmLog.createBy
        }
    }

    private fun toDetailDto(llmLog: com.ywllab.nemo.model.LlmLog): LlmLogDetailDto {
        val user = UserDao.getById(llmLog.userId)
        return LlmLogDetailDto().apply {
            logId = llmLog.logId
            bizType = llmLog.bizType
            bizId = llmLog.bizId
            userId = llmLog.userId
            username = user?.username
            accountId = llmLog.accountId
            url = llmLog.url
            model = llmLog.model
            inputContent = formatJson(llmLog.inputContent)
            outputContent = llmLog.outputContent?.let { formatJson(it) }
            inputTokenCount = llmLog.inputTokenCount
            outputTokenCount = llmLog.outputTokenCount
            totalTokenCount = llmLog.totalTokenCount
            createTime = llmLog.createTime
            createBy = llmLog.createBy
        }
    }

    private fun formatJson(content: String): String {
        return try {
            val obj = JSONUtil.parseObj(content)
            JSONUtil.toJsonPrettyStr(obj)
        } catch (e: Exception) {
            content
        }
    }
}
