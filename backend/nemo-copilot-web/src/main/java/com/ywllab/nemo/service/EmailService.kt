package com.ywllab.nemo.service

import cn.hutool.core.lang.Validator
import cn.hutool.crypto.digest.BCrypt
import cn.hutool.extra.template.TemplateConfig
import cn.hutool.extra.template.TemplateUtil
import com.ywllab.nemo.constant.VerificationCodeType
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.ParamException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ByteArrayResource
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import java.security.SecureRandom
import kotlin.math.pow

@Service
open class EmailService(
    private val ossService: OssService
) {
    private val logger = LoggerFactory.getLogger(EmailService::class.java)
    private val secureRandom = SecureRandom()

    @Autowired
    private lateinit var javaMailSender: JavaMailSender

    @Autowired
    private lateinit var verificationCodeCache: VerifyCodeCache

    @Autowired
    private lateinit var rateLimitCache: RateLimitCache

    @Value("\${spring.profiles.active}")
    private lateinit var profile: String

    companion object {
        private const val CODE_LENGTH = 6
        private const val CODE_EXPIRY_MINUTES = 10
        private const val SEND_INTERVAL_SECONDS = 60
        private const val DAILY_EMAIL_LIMIT = 100
        private const val DAILY_IP_LIMIT = 200
    }

    val templateEngine = TemplateUtil.createEngine(TemplateConfig("templates", TemplateConfig.ResourceMode.CLASSPATH))

    /**
     * 生成6位数字验证码
     */
    open fun generateVerificationCode(): String {
        val max = 10.0.pow(CODE_LENGTH.toDouble()).toInt() - 1
        val code = secureRandom.nextInt(max)
        return String.format("%0${CODE_LENGTH}d", code)
    }

    /**
     * 发送验证码邮件
     */
    open fun sendVerificationCode(email: String, type: VerificationCodeType, ip: String? = null) {
        if (!Validator.isEmail(email)) {
            throw ParamException("邮箱格式不正确：$email")
        }
        checkRateLimit(email, ip)

        // 按profile，dev时固定验证码
        val code = if (profile == "dev") {
            "102938"
        } else {
            generateVerificationCode()
        }

        val hashedCode = BCrypt.hashpw(code, BCrypt.gensalt())

        verificationCodeCache.saveCode(email, hashedCode, type)
        rateLimitCache.incrementEmailCount(email)
        if (ip != null) {
            rateLimitCache.incrementIpCount(ip)
        }

        val context = mapOf(
            "code" to code,
            "expiryMinutes" to CODE_EXPIRY_MINUTES,
        )
        val template = templateEngine.getTemplate("email/verify-code.html")
        val htmlContent = template.render(context)
        val message = javaMailSender.createMimeMessage()
        val helper = MimeMessageHelper(message, true)

        helper.setFrom("YWLLabTeam <postmaster@deepcoord.com>")
        helper.setTo(email)
        helper.setSubject("Nemo实验室验证码")
        helper.setText(htmlContent, true)
        javaMailSender.send(message)
        logger.info("Send verification code to email={}, type={}", email, type)
    }

    open fun verifyCode(email: String, code: String, type: VerificationCodeType): Boolean {
        return verificationCodeCache.verifyAndConsume(email, code, type)
    }

    open fun verifyCodeAndMark(email: String, code: String, type: VerificationCodeType): Boolean {
        return verificationCodeCache.verifyAndMark(email, code, type)
    }

    open fun clearCode(email: String, type: VerificationCodeType) {
        verificationCodeCache.clearCode(email, type)
    }

    open fun sendInvoiceEmail(
        to: String,
        invoiceTitle: String,
        amount: Double,
        invoiceFileUrl: String,
        invoiceFileName: String,
        applyDate: String
    ) {
        if (!Validator.isEmail(to)) {
            logger.warn("Invalid email address: {}", to)
            return
        }

        try {
            val htmlContent = buildInvoiceEmailContent(invoiceTitle, amount, to, applyDate)
            val message = javaMailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom("YWLLabTeam <postmaster@deepcoord.com>")
            helper.setTo(to)
            helper.setSubject("【Nemo实验室】发票开具通知")
            helper.setText(htmlContent, true)

            // 添加附件（通过内网下载）
            val fileBytes = ossService.downloadFile(invoiceFileUrl, internal = true)
            if (fileBytes != null) {
                helper.addAttachment(invoiceFileName, ByteArrayResource(fileBytes))
                logger.info("Invoice file attached, fileName={}", invoiceFileName)
            } else {
                logger.warn("Failed to download invoice file from OSS, path={}", invoiceFileUrl)
            }

            javaMailSender.send(message)
            logger.info("Invoice email sent, to={}, title={}, amount={}", to, invoiceTitle, amount)
        } catch (e: Exception) {
            logger.error("Failed to send invoice email, to={}", to, e)
        }
    }

    /**
     * 构建发票邮件HTML内容
     */
    private fun buildInvoiceEmailContent(invoiceTitle: String, amount: Double, email: String, applyDate: String): String {
        val template = templateEngine.getTemplate("email/invoice.html")
        val context = mapOf(
            "invoiceTitle" to invoiceTitle,
            "amount" to String.format("%.2f", amount),
            "email" to email,
            "applyDate" to applyDate
        )
        return template.render(context)
    }

    private fun checkRateLimit(email: String, ip: String?) {
        if (!rateLimitCache.checkSendInterval(email)) {
            throw BizException("发送频率过高，请稍后再试")
        }
        run {
            val count = rateLimitCache.getEmailCount(email)
            if (count >= DAILY_EMAIL_LIMIT) {
                throw BizException("今日发送次数已达上限")
            }
        }
        if (ip != null) {
            run {
                val count = rateLimitCache.getIpCount(ip)
                if (count >= DAILY_IP_LIMIT) {
                    throw BizException("今日发送次数已达上限")
                }
            }
        }
    }
}
