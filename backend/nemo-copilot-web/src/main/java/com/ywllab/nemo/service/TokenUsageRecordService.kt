package com.ywllab.nemo.service

import com.ywllab.nemo.dao.TokenUsageRecordDao
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.token.TokenUsageRecordDetailDto
import com.ywllab.nemo.dto.token.TokenUsageRecordListDto
import com.ywllab.nemo.dto.token.TokenUsageRecordPageQuery
import com.ywllab.nemo.exception.NotFoundException
import org.springframework.stereotype.Service

@Service
open class TokenUsageRecordService {

    open fun pageRecords(query: TokenUsageRecordPageQuery): PageResultDto<TokenUsageRecordListDto> {
        val (list, total) = TokenUsageRecordDao.page(query)
        val dtoList = list.map { toListDto(it) }
        return PageResultDto(dtoList, total, query.pageNum, query.pageSize)
    }

    open fun getRecordDetail(recordId: String): TokenUsageRecordDetailDto {
        val record = TokenUsageRecordDao.get(recordId) ?: throw NotFoundException("记录不存在")
        return toDetailDto(record)
    }

    private fun toListDto(record: com.ywllab.nemo.model.TokenUsageRecord): TokenUsageRecordListDto {
        return TokenUsageRecordListDto().apply {
            recordId = record.recordId
            accountId = record.accountId
            orderId = record.orderId
            productId = record.productId
            usedAmount = record.usedAmount
            balanceBefore = record.balanceBefore
            balanceAfter = record.balanceAfter
            bizType = record.bizType
            bizId = record.bizId
            createTime = record.createTime
        }
    }

    private fun toDetailDto(record: com.ywllab.nemo.model.TokenUsageRecord): TokenUsageRecordDetailDto {
        return TokenUsageRecordDetailDto().apply {
            recordId = record.recordId
            accountId = record.accountId
            orderId = record.orderId
            productId = record.productId
            usedAmount = record.usedAmount
            balanceBefore = record.balanceBefore
            balanceAfter = record.balanceAfter
            bizType = record.bizType
            bizId = record.bizId
            remark = record.remark
            createTime = record.createTime
            createBy = record.createBy
        }
    }
}
