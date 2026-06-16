package com.ywllab.nemo.util

import com.alibaba.excel.EasyExcel
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.slf4j.LoggerFactory
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.OutputStream

/**
 * LLM任务输出Excel文件生成工具类
 *
 * 在原始Excel基础上追加label列，生成结果文件
 */
object LLMOutputExcelUtil {

    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * Excel输出数据类型
     */
    data class LLMOutputRow(
        val id: String,
        val text: String,
        val label: String
    )

    /**
     * 分类统计Excel输出数据类型
     */
    data class CategoryCountRow(
        val category: String,
        val count: Int
    )

    /**
     * 生成带label列的Excel输出
     * @param rows 原始输入数据（id, text）
     * @param labelMap id到label的映射
     * @param outputStream 输出流
     */
    fun writeOutputExcel(
        rows: List<LLMInputExcelUtil.LLMInputRow>?,
        labelMap: Map<String, String>,
        outputStream: OutputStream,
        sheetName: String
    ) {
        if (rows.isNullOrEmpty()) {
            return
        }
        val outputRows = rows.map { row ->
            LLMOutputRow(
                id = row.id,
                text = row.text,
                label = labelMap[row.id] ?: ""
            )
        }
        writeExcelWithFix(
            { tempOut ->
                EasyExcel.write(tempOut, LLMOutputRow::class.java)
                    .sheet(sheetName)
                    .doWrite(outputRows)
            },
            outputStream, "生成Excel输出失败"
        )
    }

    /**
     * 生成分类统计Excel（按label分组计数）
     * @param labelMap id到label的映射
     * @param outputStream 输出流
     */
    fun writeCategoryCountExcel(
        labelMap: Map<String, String>,
        outputStream: OutputStream
    ) {
        // 按label分组计数
        val categoryCount = labelMap.values
            .filter { it.isNotBlank() }
            .flatMap { it.split("@").toList() }
            .groupingBy { it }
            .eachCount()

        val countRows = categoryCount.map { (category, count) ->
            CategoryCountRow(category = category, count = count)
        }.sortedByDescending { it.count }

        writeExcelWithFix(
            { tempOut ->
                EasyExcel.write(tempOut)
                    .head(CategoryCountRow::class.java)
                    .sheet("sheet1")
                    .doWrite(countRows)
            },
            outputStream, "生成分类统计Excel失败"
        )
    }

    /**
     * 使用 EasyExcel 生成 Excel 后，用 XSSFWorkbook 重新读取并写出，修正 ZIP 结构问题
     *
     * EasyExcel 默认使用 SXSSF streaming 模式，生成 ZIP 时使用 data descriptor，
     * 导致 local file header 中的 size 为 0，SheetJS 无法解析。
     * 通过 XSSFWorkbook 重新处理后，生成标准 ZIP 结构。
     *
     * @param writer EasyExcel 写入函数
     * @param outputStream 目标输出流
     * @param errorMsg 错误信息前缀
     */
    private fun writeExcelWithFix(
        writer: (ByteArrayOutputStream) -> Unit,
        outputStream: OutputStream,
        errorMsg: String
    ) {
        try {
            val tempOut = ByteArrayOutputStream()
            writer(tempOut)
            val workbook = XSSFWorkbook(ByteArrayInputStream(tempOut.toByteArray()))
            workbook.write(outputStream)
            workbook.close()
        } catch (e: Exception) {
            log.error("$errorMsg: {}", e.message, e)
            throw e
        }
    }
}
