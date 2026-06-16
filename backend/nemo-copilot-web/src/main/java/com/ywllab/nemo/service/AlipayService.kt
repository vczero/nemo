package com.ywllab.nemo.service

import cn.hutool.json.JSONUtil
import com.alibaba.fastjson.JSON
import com.alipay.api.AlipayClient
import com.alipay.api.AlipayConfig
import com.alipay.api.AlipayConstants
import com.alipay.api.DefaultAlipayClient
import com.alipay.api.domain.AlipayTradePagePayModel
import com.alipay.api.domain.AlipayTradeQueryModel
import com.alipay.api.domain.AlipayTradeRefundModel
import com.alipay.api.internal.util.AlipaySignature
import com.alipay.api.request.AlipayTradePagePayRequest
import com.alipay.api.request.AlipayTradeQueryRequest
import com.alipay.api.request.AlipayTradeRefundRequest
import com.alipay.api.response.AlipayTradePagePayResponse
import com.alipay.api.response.AlipayTradeQueryResponse
import com.alipay.api.response.AlipayTradeRefundResponse
import com.ywllab.nemo.constant.OrderStatus
import com.ywllab.nemo.constant.PayMethod
import com.ywllab.nemo.constant.SysctlKey
import com.ywllab.nemo.dao.SysctlDao
import com.ywllab.nemo.dto.payment.AlipayConfigDto
import com.ywllab.nemo.dto.payment.AlipayOrderBizModel
import com.ywllab.nemo.dto.payment.AlipayRefundRequest
import com.ywllab.nemo.dto.payment.AlipayTradeQueryResult
import com.ywllab.nemo.exception.SystemException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import javax.servlet.http.HttpServletRequest

/***
支付宝文档参考：
 * https://opendocs.alipay.com/open/59da99d0_alipay.trade.page.pay?scene=22&pathHash=e26b497f#%E4%B8%9A%E5%8A%A1%E8%AF%B7%E6%B1%82%E5%8F%82%E6%95%B0
 * https://opendocs.alipay.com/support/01ravn
 * 收到异步通知后，
 * 输出 success 表示消息获取成功，支付宝就会停止发送异步，
 * 输出 fail，表示消息获取失败，支付宝会重新发送消息到异步地址。
 * 建议在接收异步进行验签，如果验签成功输出 success，验签失败返回 fail，重新接收异步进行处理。
 */
@Service
class AlipayService {

    @Value("\${spring.profiles.active}")
    private lateinit var profile: String

    private var connectTimeout: Int = 30000
    private var readTimeout: Int = 60000

    @Autowired
    private lateinit var orderService: OrderService

    val logger = LoggerFactory.getLogger(javaClass)

    private fun createAlipayClient(config: AlipayConfigDto): AlipayClient {
        val alipayConfig = AlipayConfig().apply {
            serverUrl = if (profile.contains("prod")) {
                AlipayConfigDto.SERVER_URL
            } else {
                AlipayConfigDto.SERVER_URL_DEV
            }
            format = AlipayConstants.FORMAT_JSON
            appId = config.appId
            privateKey = config.privateKey
            alipayPublicKey = config.aliPayPublicKey
            signType = AlipayConstants.SIGN_TYPE_RSA2
            this.connectTimeout = this.connectTimeout
            this.readTimeout = this.readTimeout
        }
        return DefaultAlipayClient(alipayConfig)
    }

    fun getConfig(): AlipayConfigDto {
        val configJson = SysctlDao.get(SysctlKey.ALIPAY_CONFIG)
        return if (configJson.isNullOrBlank()) {
            logger.warn("支付宝配置为空，请先在BOSS系统配置支付宝参数")
            AlipayConfigDto().apply {
                enabled = false
            }
        } else {
            try {
                val config = JSON.parseObject(configJson, AlipayConfigDto::class.java)
                logger.debug(
                    """
                    获取到支付宝配置: appId=${config.appId},
                    notifyUrl=${config.notifyUrl},
                    returnUrl=${config.returnUrl}
                    """.trimIndent()
                )
                config
            } catch (e: Exception) {
                logger.error("解析支付宝配置失败: $configJson", e)
                AlipayConfigDto().apply {
                    enabled = false
                }
            }
        }
    }

    fun saveConfig(config: AlipayConfigDto) {
        config.enabled = config.appId.isNotBlank() &&
            config.privateKey.isNotBlank() &&
            config.publicKey.isNotBlank() &&
            config.aliPayPublicKey.isNotBlank()
        val configJson = JSON.toJSONString(config)
        SysctlDao.set(SysctlKey.ALIPAY_CONFIG, configJson)
    }

    fun createPaymentOrder(request: AlipayOrderBizModel, qrcodeWidth: Int): String {
        val config = getConfig()
        if (!config.enabled) {
            throw IllegalStateException("支付宝支付未配置")
        }
        logger.info(
            "创建支付宝支付订单: " +
                "outTradeNo=${request.outTradeNo}, totalAmount=${request.totalAmount}, subject=${request.subject}"
        )

        val alipayClient = createAlipayClient(config)

        val model = AlipayTradePagePayModel().apply {
            outTradeNo = request.outTradeNo
            totalAmount = request.totalAmount.toString()
            subject = request.subject
            body = request.body ?: ""
            timeoutExpress = request.timeoutExpress
            productCode = request.productCode
            qrPayMode = "4"
            this.qrcodeWidth = qrcodeWidth.toLong()
        }
        var response: AlipayTradePagePayResponse? = null
        try {
            val payRequest = AlipayTradePagePayRequest().apply {
                bizModel = model
                notifyUrl = config.notifyUrl
                returnUrl = config.returnUrl
            }
            response = alipayClient.pageExecute(payRequest, "GET")
            // 打印响应信息用于调试
            logger.info(
                "支付宝响应: isSuccess=${response.isSuccess}, code=${response.code}, msg=${response.msg}, " +
                    "subCode=${response.subCode}, subMsg=${response.subMsg}"
            )
            // 如果响应失败，打印更多调试信息
            if (!response.isSuccess) {
                logger.error(
                    "支付宝支付请求失败: code=${response.code}, msg=${response.msg}, " +
                        "subCode=${response.subCode}, subMsg=${response.subMsg}"
                )
                // 打印部分body内容用于调试
                logger.error("支付宝响应body前500字符: ${response.body.take(500)}")
                throw SystemException("支付宝支付请求失败: ${response.msg} ${response.subMsg}")
            }
            return response.body
        } catch (e: Exception) {
            logger.error("无法获取支付宝响应内容: outTradeNo=${request.outTradeNo}", e)
            throw SystemException("支付宝支付调用失败: ${e.message}")
        }
    }

    /**
     * 从错误消息中提取HTML内容
     */
    private fun extractHtmlFromError(errorMsg: String): String? {
        return try {
            // 错误消息格式通常是: "expected value at column 1, <html>..."
            val htmlStart = errorMsg.indexOf("<html")
            if (htmlStart >= 0) {
                errorMsg.substring(htmlStart)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    fun queryTrade(outTradeNo: String): AlipayTradeQueryResult {
        val config = getConfig()
        if (!config.enabled) {
            throw IllegalStateException("支付宝支付未配置")
        }

        val alipayClient = createAlipayClient(config)

        val model = AlipayTradeQueryModel().apply {
            this.outTradeNo = outTradeNo
        }

        val queryRequest = AlipayTradeQueryRequest().apply {
            bizModel = model
        }

        val response: AlipayTradeQueryResponse = alipayClient.execute(queryRequest)
        return AlipayTradeQueryResult().apply {
            success = response.isSuccess
            tradeNo = response.tradeNo
            this.outTradeNo = outTradeNo
            tradeStatus = response.tradeStatus
            buyerPayAmount = response.buyerPayAmount?.toDoubleOrNull() ?: 0.0
            totalAmount = response.totalAmount?.toDoubleOrNull() ?: 0.0
        }
    }

    fun refund(request: AlipayRefundRequest): Boolean {
        val config = getConfig()
        if (!config.enabled) {
            throw IllegalStateException("支付宝支付未配置")
        }

        val alipayClient = createAlipayClient(config)

        val model = AlipayTradeRefundModel().apply {
            outTradeNo = request.outTradeNo
            refundAmount = request.refundAmount.toString()
            outRequestNo = request.outRequestNo
        }

        val refundRequest = AlipayTradeRefundRequest().apply {
            bizModel = model
        }

        val response: AlipayTradeRefundResponse = alipayClient.execute(refundRequest)
        return response.isSuccess
    }

    fun handleNotify(request: HttpServletRequest): String {
        logger.info("支付宝支付回调通知: ${request.parameterNames.toList()}")
        try {
            val config = getConfig()
            if (!config.enabled) {
                logger.warn("支付宝支付未配置，忽略回调")
                return "fail"
            }

            // 从 HttpServletRequest 获取 POST 表单数据
            val params = HashMap<String, String>()
            request.parameterNames.toList().forEach { key ->
                params[key] = request.getParameter(key)
            }
            logger.info("body: ${JSONUtil.toJsonStr(params)}")

            // 打印所有参数用于调试
            logger.info("支付宝回调参数: ${params.keys.joinToString(", ")}")
            if (!params.containsKey("sign") || params["sign"].isNullOrBlank()) {
                logger.error("支付宝回调缺少sign参数或sign为空，完整参数: $params")
                return "fail"
            }
            // 验签
            val charset = params["charset"] ?: AlipayConfigDto.CHARSET
            val signType = params["sign_type"] ?: AlipayConfigDto.SIGN_TYPE
            // 使用 rsaCheckV2 的 4 参数版本，明确指定 signType
            val verified = AlipaySignature.rsaCheckV1(
                params,
                config.aliPayPublicKey,
                charset,
                signType
            )
            if (!verified) {
                logger.warn("支付宝验签失败: $params")
                return "fail"
            }
            // 处理支付结果
            when (params["trade_status"]) {
                "TRADE_SUCCESS" -> {
                    // 支付成功，更新订单状态
                    val outTradeNo = params["out_trade_no"]
                    val tradeNo = params["trade_no"]
                    val buyerPayAmount = params["buyer_pay_amount"]?.toDoubleOrNull() ?: 0.0
                    // 根据outTradeNo查询订单并更新状态
                    if (outTradeNo != null) {
                        // 幂等性检查：验证订单状态，避免重复处理
                        val currentStatus = orderService.getOrderStatus(outTradeNo)
                        if (currentStatus == null) {
                            logger.info("支付宝回调订单不存在: outTradeNo=$outTradeNo, tradeNo=$tradeNo")
                            return "success"
                        }
                        if (currentStatus == OrderStatus.PAID) {
                            logger.info("支付宝回调重复通知，已处理过: outTradeNo=$outTradeNo, tradeNo=$tradeNo")
                            return "success"
                        }
                        if (currentStatus != OrderStatus.UN_PAY) {
                            logger.warn("支付宝回调订单状态异常: outTradeNo=$outTradeNo, status=$currentStatus")
                            return "fail"
                        }
                        orderService.finishOrder(outTradeNo, buyerPayAmount, PayMethod.ALIPAY)
                        logger.info("支付宝支付成功，订单状态已更新: outTradeNo=$outTradeNo, tradeNo=$tradeNo, amount=$buyerPayAmount")
                    } else {
                        logger.warn("支付宝支付成功，但outTradeNo为空")
                    }

                    return "success"
                }

                "WAIT_BUYER_PAY" -> {
                    // 等待买家付款
                    logger.debug("支付宝等待买家付款: outTradeNo=${params["out_trade_no"]}")
                    return "success"
                }

                else -> {
                    logger.info("支付宝回调状态未知: trade_status=${params["trade_status"]}, outTradeNo=${params["out_trade_no"]}")
                    return "success"
                }
            }
        } catch (e: Throwable) {
            logger.error("处理支付宝回调异常", e)
            return "fail"
        }
    }
}
