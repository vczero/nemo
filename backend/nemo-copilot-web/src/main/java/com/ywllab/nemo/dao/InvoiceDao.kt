package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.InvoiceStatus
import com.ywllab.nemo.constant.InvoiceType
import com.ywllab.nemo.dto.PageQuery
import com.ywllab.nemo.dto.invoice.InvoiceQueryParam
import com.ywllab.nemo.model.Invoice
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object InvoiceDao : BaseDao<Invoice>("nemo_invoice") {
    val invoiceId = varchar("invoice_id", 32)
    val invoiceNo = varchar("invoice_no", 32)
    val userId = varchar("user_id", 32)
    val invoiceType = enumerationByName<InvoiceType>("invoice_type", 20)
    val title = varchar("title", 190)
    val amount = decimal("amount", 10, 2)
    val creditCode = varchar("credit_code", 18).nullable()
    val email = varchar("email", 190)
    val remark = varchar("remark", 190).nullable()
    val status = enumerationByName<InvoiceStatus>("status", 32)
    val rejectReason = varchar("reject_reason", 190).nullable()
    val invoiceFileUrl = varchar("invoice_file_url", 500).nullable()
    val applyTime = long("apply_time")
    val issueTime = long("issue_time").nullable()

    override val primaryKey = PrimaryKey(invoiceId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf(self.invoiceType, self.status)).also {
            it.invoiceType = row[self.invoiceType]
            it.status = row[self.status]
        }
    }

    override fun createModel(): Invoice {
        return Invoice()
    }

    fun getById(idParam: String): Invoice? {
        return transaction {
            select { self.invoiceId eq idParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByInvoiceNo(invoiceNoParam: String): Invoice? {
        return transaction {
            select { self.invoiceNo eq invoiceNoParam }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getByUserId(userIdParam: String, pageNum: Int = 1, pageSize: Int = 20): Pair<List<Invoice>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = pageNum.toLong()
            this.pageSize = pageSize.toLong()
        }
        return page(pageQuery) {
            self.userId eq userIdParam
        }
    }

    fun create(invoice: Invoice) {
        transaction {
            self.insert {
                it[invoiceId] = invoice.invoiceId
                it[invoiceNo] = invoice.invoiceNo
                it[userId] = invoice.userId
                it[invoiceType] = invoice.invoiceType
                it[title] = invoice.title
                it[amount] = invoice.amount.toBigDecimal()
                it[creditCode] = invoice.creditCode
                it[email] = invoice.email
                it[remark] = invoice.remark
                it[status] = invoice.status
                it[rejectReason] = invoice.rejectReason
                it[invoiceFileUrl] = invoice.invoiceFileUrl
                it[applyTime] = invoice.applyTime
                it[issueTime] = invoice.issueTime
                it[createBy] = invoice.createBy
                it[createTime] = invoice.createTime
                it[updateBy] = invoice.updateBy
                it[updateTime] = invoice.updateTime
            }
        }
    }

    fun update(invoice: Invoice) {
        transaction {
            update({ invoiceId eq invoice.invoiceId }) {
                it[status] = invoice.status
                it[rejectReason] = invoice.rejectReason
                it[invoiceFileUrl] = invoice.invoiceFileUrl
                it[issueTime] = invoice.issueTime
                it[updateBy] = invoice.updateBy
                it[updateTime] = invoice.updateTime
            }
        }
    }

    /**
     * 统计用户已开票金额
     */
    fun sumIssuedAmountByUserId(userIdParam: String): Double {
        return transaction {
            val invoices = select {
                (self.userId eq userIdParam) and (self.status eq InvoiceStatus.ISSUED)
            }.map(mapper)
            invoices.sumOf { it.amount }
        }
    }

    /**
     * 管理员查询发票列表
     */
    fun list(query: InvoiceQueryParam): Pair<List<Invoice>, Long> {
        val pageQuery = PageQuery().apply {
            this.pageNum = query.pageNum
            this.pageSize = query.pageSize
        }
        return page(pageQuery, self.applyTime, SortOrder.DESC) {
            var condition: Op<Boolean> = Op.TRUE
            // 用户ID筛选
            val userId = query.userId
            if (!userId.isNullOrBlank()) {
                condition = condition and (self.userId eq userId)
            }
            // 发票类型筛选
            val invoiceType = query.invoiceType
            if (invoiceType != null) {
                condition = condition and (self.invoiceType eq invoiceType)
            }
            condition
        }
    }
}
