package com.ywllab.nemo.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.session.web.http.CookieSerializer
import org.springframework.session.web.http.DefaultCookieSerializer

@Configuration
open class SessionConfig {

    @Value("\${spring.profiles.active:default}")
    private lateinit var activeProfile: String

    @Bean
    open fun cookieSerializer(): CookieSerializer {
        val serializer = DefaultCookieSerializer()
        serializer.setCookieName("YWLLAB_SESSION_${activeProfile.uppercase()}")
        serializer.setCookiePath("/")
        serializer.setCookieMaxAge(7 * 24 * 60 * 60)
        serializer.setSameSite("Lax")
        serializer.setUseHttpOnlyCookie(true)
        return serializer
    }
}
