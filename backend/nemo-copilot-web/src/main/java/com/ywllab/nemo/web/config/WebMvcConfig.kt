package com.ywllab.nemo.web.config

import com.ywllab.nemo.web.interceptor.AuthenticationInterceptor
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
open class WebMvcConfig : WebMvcConfigurer {

    @Autowired
    private lateinit var authenticationInterceptor: AuthenticationInterceptor

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(authenticationInterceptor)
            .addPathPatterns("/boss/api/**") // 拦截所有 API 请求
            .addPathPatterns("/api/**") // 拦截所有 API 请求
            .excludePathPatterns(
                "/api/user/login", // 登录
                "/api/user/logout", // 登出
                "/api/user/register-by-email", // 注册
                "/api/user/change-password-by-code", // 修改密码
                "/api/email/**", // 邮箱验证码相关接口
                "/api/agreement/**", // 协议相关接口（无需登录）
                "/api/sysctl/config", // 系统配置
                "/doc.html", // Swagger 文档
                "/swagger-resources/**", // Swagger 资源
                "/v2/api-docs", // Swagger API 文档
                "/webjars/**", // Swagger 静态资源
                // boss 相关接口
                "/boss/api/user/login"
            )
    }
}
