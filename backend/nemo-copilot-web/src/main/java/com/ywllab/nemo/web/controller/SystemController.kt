package com.ywllab.nemo.web.controller

import cn.hutool.json.JSONUtil
import com.google.common.cache.Cache
import com.google.common.cache.CacheBuilder
import com.ywllab.nemo.constant.SysctlKey
import com.ywllab.nemo.dao.SysctlDao
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.system.SystemConfigDto
import com.ywllab.nemo.dto.system.ViewConfigDto
import com.ywllab.nemo.service.OssService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.TimeUnit

@Api(tags = ["系统配置"])
@RestController
@RequestMapping("/api/sysctl")
open class SystemController {

    @Autowired
    lateinit var ossService: OssService

    private val cache: Cache<String, SystemConfigDto> = CacheBuilder.newBuilder()
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .maximumSize(1000)
        .build()

    companion object {
        private const val CACHE_KEY = "sysctl_config"
    }

    @ApiOperation("系统配置")
    @GetMapping("/config")
    open fun getConfig(): ResultDto<SystemConfigDto> {
        cache.getIfPresent(CACHE_KEY)?.let { return ResultDto(it) }

        val config = SystemConfigDto()
        val value = SysctlDao.get(SysctlKey.VIEW_CONFIG) ?: return ResultDto.success(config)
        val viewConfig = JSONUtil.toBean(value, ViewConfigDto::class.java)
        // 生成带签名的URL
        if (viewConfig.banner.imageUrl.isNotBlank()) {
            viewConfig.banner.imageUrl = ossService.generatePresignedUrl(viewConfig.banner.imageUrl)
        }
        // 菜单链接如果是OSS路径也转成公网URL
        viewConfig.menus.forEach { menu ->
            if (menu.link.isNotBlank() && menu.link.startsWith("/")) {
                menu.link = ossService.generatePresignedUrl(menu.link)
            }
        }
        config.viewConfig = viewConfig
        val result = ResultDto.success(config)
        cache.put(CACHE_KEY, config)
        return result
    }
}
