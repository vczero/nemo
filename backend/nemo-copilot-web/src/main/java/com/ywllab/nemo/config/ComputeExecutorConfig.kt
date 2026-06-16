package com.ywllab.nemo.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@Configuration
open class ComputeExecutorConfig {

    @Bean("computeExecutor")
    open fun computeExecutor(): ExecutorService {
        return Executors.newFixedThreadPool(20)
    }
}
