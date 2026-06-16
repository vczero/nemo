package com.ywllab.nemo.service

import cn.hutool.core.io.file.FileNameUtil
import cn.hutool.core.lang.Validator
import cn.hutool.core.util.IdUtil
import cn.hutool.core.util.StrUtil
import com.ywllab.nemo.constant.InvoiceStatus
import com.ywllab.nemo.constant.InvoiceType
import com.ywllab.nemo.constant.OrderSource
import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.dao.InvoiceDao
import com.ywllab.nemo.dao.OrderDao
import com.ywllab.nemo.dao.UserAccountDao
import com.ywllab.nemo.dto.CommonPageQuery
import com.ywllab.nemo.dto.PageResultDto
import com.ywllab.nemo.dto.invoice.AvailableInvoiceAmountDTO
import com.ywllab.nemo.dto.invoice.InvoiceApplyParam
import com.ywllab.nemo.dto.invoice.InvoiceDTO
import com.ywllab.nemo.dto.invoice.InvoiceQueryParam
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.model.Invoice
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.text.SimpleDateFormat
import java.util.Date
import java.util.concurrent.TimeUnit

@Service
open class InvoiceService(
    private val notificationService: NotificationService,
    private val emailService: EmailService,
    private val ossService: OssService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 申请开具发票
     */
    open fun applyInvoice(request: InvoiceApplyParam): String {
        val userId = UserSessionHelper.getUserId()
        // 验证开票金额
        val availableAmount = getAvailableInvoiceAmount(userId)
        if (request.amount > availableAmount.availableAmount) {
            throw BizException("开票金额不能超过可开票金额 ${availableAmount.availableAmount} 元")
        }

        if (request.amount <= 0) {
            throw BizException("开票金额必须大于0")
        }

        // 企业发票验证信用代码
        if (request.invoiceType == InvoiceType.ENTERPRISE) {
            if (StrUtil.isBlank(request.creditCode)) {
                throw BizException("企业发票必须填写社会统一信用代码")
            }
            if (request.creditCode!!.length != 18) {
                throw BizException("社会统一信用代码必须为18位")
            }
        }

        // 验证邮箱格式
        if (!Validator.isEmail(request.email)) {
            throw BizException("邮箱格式不正确")
        }

        val now = System.currentTimeMillis()
        val invoice = Invoice().apply {
            invoiceId = IdUtil.getSnowflakeNextIdStr()
            invoiceNo = generateInvoiceNo()
            this.userId = userId
            invoiceType = request.invoiceType
            title = request.title
            amount = request.amount
            creditCode = request.creditCode
            email = request.email
            remark = request.remark
            status = InvoiceStatus.PENDING
            applyTime = now
            createBy = userId
            createTime = now
            updateBy = userId
            updateTime = now
        }

        InvoiceDao.create(invoice)
        logger.info("发票申请成功:  invoiceNo=${invoice.invoiceNo}, userId=$userId, amount=${request.amount}")

        return invoice.invoiceId
    }

    /**
     * 获取可开票金额
     */
    open fun getAvailableInvoiceAmount(userId: String): AvailableInvoiceAmountDTO {
        val account = UserAccountDao.getByUserId(userId) ?: throw BizException("账户不存在")
        // 计算已支付订单总金额（过滤48h以内的订单）
        val (orders, _) = OrderDao.getByAccountId(account.accountId, 1, Int.MAX_VALUE)
        val paidOrders = orders
            .filter { it.paidTime != null }
            .filter { it.status == OrderStatus.PAID }
            .filter { it.source == OrderSource.TO_C }
        val totalPaidAmount = paidOrders.sumOf { it.payAmount }

        // 计算已开票金额
        val (invoices, _) = InvoiceDao.getByUserId(userId, 1, Int.MAX_VALUE)
        val totalInvoicedAmount = invoices.sumOf { it.amount }

        val availableAmount = totalPaidAmount - totalInvoicedAmount

        return AvailableInvoiceAmountDTO().apply {
            this.totalPaidAmount = totalPaidAmount
            this.totalInvoicedAmount = totalInvoicedAmount
            this.availableAmount = if (availableAmount > 0) availableAmount else 0.0
        }
    }

    /**
     * 获取我的发票列表
     */
    open fun getMyInvoices(query: CommonPageQuery): PageResultDto<InvoiceDTO> {
        val userId = UserSessionHelper.getUserId()
        val queryWithUserId = InvoiceQueryParam().apply {
            this.pageNum = query.pageNum
            this.pageSize = query.pageSize
            this.userId = userId
        }
        val (invoices, total) = InvoiceDao.list(queryWithUserId)
        val dtos = invoices.map { toDTO(it) }
        return PageResultDto(dtos, total, query.pageNum, query.pageSize)
    }

    /**
     * 获取发票详情
     */
    open fun getInvoiceDetail(invoiceId: String): InvoiceDTO? {
        val invoice = InvoiceDao.getById(invoiceId) ?: return null
        val userId = UserSessionHelper.getUserId()
        if (invoice.userId != userId) {
            throw BizException("无权访问此发票")
        }
        return toDTO(invoice)
    }

    /**
     * 管理员查询发票列表
     */
    open fun listInvoicesForAdmin(query: InvoiceQueryParam): PageResultDto<InvoiceDTO> {
        val (invoices, total) = InvoiceDao.list(query)
        val dtos = invoices.map { toDTO(it) }
        return PageResultDto(dtos, total, query.pageNum, query.pageSize)
    }

    /**
     * 管理员更新发票状态
     */
    open fun updateInvoiceStatus(
        invoiceId: String,
        status: InvoiceStatus,
        rejectReason: String? = null,
        invoiceFileUrl: String? = null
    ) {
        val invoice = InvoiceDao.getById(invoiceId) ?: throw BizException("发票不存在")
        val operator = UserSessionHelper.getUsername() ?: "SYSTEM"
        val isIssued = status == InvoiceStatus.ISSUED

        invoice.status = status
        invoice.rejectReason = rejectReason
        invoice.invoiceFileUrl = invoiceFileUrl
        if (isIssued) {
            invoice.issueTime = System.currentTimeMillis()
        }
        invoice.updateBy = operator
        invoice.updateTime = System.currentTimeMillis()

        // 开票成功发送通知
        if (isIssued) {
            sendInvoiceIssuedNotification(invoice)
        }

        logger.info("发票状态更新: invoiceId=$invoiceId, status=$status, operator=$operator")
        InvoiceDao.update(invoice)
    }

    /**
     * 发送开票成功通知
     */
    private fun sendInvoiceIssuedNotification(invoice: Invoice) {
        val applyDate = SimpleDateFormat("yyyy年MM月dd日").format(Date(invoice.applyTime))
        val title = "发票开具成功"
        val content =
            "您好，您于${applyDate}申请的发票，抬头为${invoice.title}，金额为${invoice.amount}元，请查收。"
        try {
            // 发送系统通知
            notificationService.sendInvoiceNotification(
                userId = invoice.userId,
                title = title,
                content = content,
                invoiceId = invoice.invoiceId
            )
        } catch (e: Exception) {
            logger.error("发送开票通知失败: invoiceId=${invoice.invoiceId}", e)
        }

        // 发送发票邮件
        invoice.invoiceFileUrl?.let { fileUrl ->
            try {
                val fileType = FileNameUtil.getSuffix(fileUrl)
                val fileName = "发票_${invoice.title}_${invoice.amount}元.$fileType"
                emailService.sendInvoiceEmail(
                    to = invoice.email,
                    invoiceTitle = invoice.title,
                    amount = invoice.amount,
                    invoiceFileUrl = fileUrl,
                    invoiceFileName = fileName,
                    applyDate = applyDate
                )
            } catch (e: Exception) {
                logger.error("发送发票邮件失败: invoiceId=${invoice.invoiceId}", e)
            }
        }
    }

    /**
     * 管理员开具发票
     */
    open fun issueInvoice(invoiceId: String, invoiceFileUrl: String) {
        updateInvoiceStatus(invoiceId, InvoiceStatus.ISSUED, null, invoiceFileUrl)
    }

    /**
     * 管理员获取发票详情
     */
    open fun getInvoiceDetailForAdmin(invoiceId: String): InvoiceDTO? {
        val invoice = InvoiceDao.getById(invoiceId) ?: return null
        return toDTO(invoice)
    }

    private fun toDTO(invoice: Invoice): InvoiceDTO {
        val fileUrl = invoice.invoiceFileUrl?.let {
            ossService.generatePresignedUrl(it, 7, TimeUnit.DAYS)
        }
        return InvoiceDTO().apply {
            invoiceId = invoice.invoiceId
            invoiceNo = invoice.invoiceNo
            invoiceType = invoice.invoiceType
            invoiceTypeDescription = invoice.invoiceType.description
            title = invoice.title
            amount = invoice.amount
            creditCode = invoice.creditCode
            email = invoice.email
            remark = invoice.remark
            status = invoice.status
            statusDescription = invoice.status.description
            rejectReason = invoice.rejectReason
            invoiceFileUrl = fileUrl
            applyTime = invoice.applyTime
            issueTime = invoice.issueTime
            createTime = invoice.createTime
        }
    }

    private fun generateInvoiceNo(): String {
        // 发票号格式: INV + 时间戳 + 随机数
        val timestamp = System.currentTimeMillis().toString().takeLast(8)
        val random = (0..9999).random().toString().padStart(4, '0')
        return "INV$timestamp$random"
    }
}
