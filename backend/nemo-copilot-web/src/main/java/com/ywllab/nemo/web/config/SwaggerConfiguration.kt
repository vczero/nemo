package com.ywllab.nemo.web.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import springfox.documentation.builders.RequestHandlerSelectors
import springfox.documentation.spi.DocumentationType
import springfox.documentation.spring.web.plugins.Docket
import springfox.documentation.swagger2.annotations.EnableSwagger2

@EnableSwagger2
@Configuration
open class SwaggerConfiguration {

    @Bean
    open fun docket1(): Docket {
        val backPackage = RequestHandlerSelectors.basePackage("com.ywllab.nemo.web.controller")
        return Docket(DocumentationType.SWAGGER_2).groupName("1.WEB")
            .select().apis(backPackage).build()
    }

    @Bean
    open fun docket2(): Docket {
        val backPackage = RequestHandlerSelectors.basePackage("com.ywllab.nemo.web.boss.controller")
        return Docket(DocumentationType.SWAGGER_2).groupName("2.BOSS")
            .select().apis(backPackage).build()
    }
}
