package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.payment.AlipayConfigDto
import com.ywllab.nemo.service.AlipayService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-支付配置"])
@RestController
@RequestMapping("/boss/api/payments")
open class BossPaymentController {

    @Autowired
    lateinit var alipayService: AlipayService

    @ApiOperation("获取支付宝配置")
    @GetMapping("/alipay")
    open fun getAlipayConfig(): ResultDto<AlipayConfigDto> {
        return ResultDto.success(alipayService.getConfig())
    }

    @ApiOperation("保存支付宝配置")
    @PostMapping("/alipay")
    open fun saveAlipayConfig(@RequestBody config: AlipayConfigDto): ResultDto<Unit> {
        alipayService.saveConfig(config)
        return ResultDto.success()
    }
}
