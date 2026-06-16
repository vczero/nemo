package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.SysctlKey
import com.ywllab.nemo.dao.SysctlDao
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.service.OssService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Api(tags = ["BOSS-系统配置"])
@RestController
@RequestMapping("/boss/api/systctl")
open class BossSystctlController {
    @Autowired
    lateinit var ossService: OssService

    @ApiOperation("查询")
    @GetMapping("/{key}")
    open fun getSysctl(
        @PathVariable key: String
    ): ResultDto<String?> {
        val value = SysctlDao.get(SysctlKey.valueOf(key))
        return ResultDto.success(value)
    }

    @ApiOperation("保存")
    @PostMapping("/{key}")
    open fun setSysctl(
        @PathVariable key: String,
        @RequestBody request: Map<String, String>
    ): ResultDto<Boolean> {
        val value = request["value"] ?: throw IllegalArgumentException("value is required")
        SysctlDao.set(SysctlKey.valueOf(key), value)
        return ResultDto.success(true)
    }

    @ApiOperation("生成预览URL")
    @GetMapping("/{key}/preview-url")
    open fun getPreviewUrl(
        @PathVariable key: String,
        @RequestParam ossPath: String
    ): ResultDto<String> {
        if (key != SysctlKey.VIEW_CONFIG.name) {
            throw IllegalArgumentException("不支持的key")
        }
        val url = ossService.generatePresignedUrl(ossPath)
        return ResultDto.success(url)
    }
}
