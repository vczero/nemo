package com.ywllab.nemo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(
    exclude = [
        DataSourceAutoConfiguration::class,
        DataSourceTransactionManagerAutoConfiguration::class,
    ],
    scanBasePackages = [
        "com.ywllab.nemo"
    ]
)
@EnableScheduling
open class Application : SpringBootServletInitializer() {

    override fun configure(builder: SpringApplicationBuilder): SpringApplicationBuilder {
        return builder.sources(Application::class.java)
    }
}

fun main(args: Array<String>) {
    // 启用 TLS 1.3 支持 (JDK 8 需要 Conscrypt)
    java.security.Security.insertProviderAt(org.conscrypt.Conscrypt.newProvider(), 1)
    runApplication<Application>(*args)
}
