package com.ywllab.nemo.util

import com.alibaba.excel.EasyExcel
import com.alibaba.excel.context.AnalysisContext
import com.alibaba.excel.read.listener.ReadListener
import com.ywllab.nemo.exception.BizException
import org.slf4j.LoggerFactory
import java.io.InputStream

object LLMInputExcelUtil {

    private val log = LoggerFactory.getLogger(javaClass)
    private const val MAX_ROWS = 5000

    data class LLMInputRow(val id: String, val text: String)

    @Suppress("UNCHECKED_CAST")
    fun parseExcel(inputStream: InputStream): List<LLMInputRow> {
        val rows = mutableListOf<LLMInputRow>()
        val seenIds = mutableSetOf<String>()

        val listener = object : ReadListener<Any> {
            private var rowCount = 0

            override fun invoke(data: Any, context: AnalysisContext) {
                rowCount++
                if (rowCount > MAX_ROWS) {
                    throw BizException("输入数据超过最大限制${MAX_ROWS}行")
                }

                val rowMap = data as? Map<*, *>
                    ?: return

                val idCell = rowMap[0]?.toString()?.trim() ?: ""
                val textCell = rowMap[1]?.toString()?.trim() ?: ""

                if (idCell.isBlank()) {
                    throw BizException("第${rowCount}行id字段不能为空")
                }
                if (idCell in seenIds) {
                    throw BizException("id字段值不唯一: $idCell")
                }
                seenIds.add(idCell)

                if (textCell.isBlank()) {
                    throw BizException("第${rowCount}行text字段不能为空")
                }

                rows.add(LLMInputRow(id = idCell, text = textCell))
            }

            override fun doAfterAllAnalysed(context: AnalysisContext) {}
        }

        try {
            EasyExcel.read(inputStream, listener)
                .sheet()
                .headRowNumber(1)
                .doRead()
        } catch (e: BizException) {
            throw e
        } catch (e: Exception) {
            log.error("Excel解析失败: {}", e.message, e)
            throw BizException("Excel文件解析失败: ${e.message}")
        }

        return rows
    }
}
