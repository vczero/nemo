package com.ywllab.nemo.web.controller

import com.ywllab.nemo.service.AlipayService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.servlet.http.HttpServletRequest

@Api(tags = ["支付回调"])
@RestController
@RequestMapping("/api/payment")
open class OrderPayNotifyController {

    @Autowired
    lateinit var alipayService: AlipayService

    @ApiOperation("异步通知回调-支付宝")
    @PostMapping("/notify/alipay")
    open fun alipayNotify(request: HttpServletRequest): String {
        return alipayService.handleNotify(request)
    }
}
