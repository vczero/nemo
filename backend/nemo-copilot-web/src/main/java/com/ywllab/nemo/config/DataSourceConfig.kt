package com.ywllab.nemo.config

import com.ywllab.nemo.dao.DatabaseManager
import org.jetbrains.exposed.sql.Database
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.DependsOn
import org.springframework.context.annotation.Primary
import org.springframework.jdbc.datasource.DataSourceTransactionManager
import org.springframework.transaction.PlatformTransactionManager

@Configuration
open class DataSourceConfig {

    @Value("\${spring.profiles.active:}")
    lateinit var activeProfile: String

    @Autowired
    lateinit var databaseManager: DatabaseManager

    companion object {
        var dataSource: javax.sql.DataSource? = null
        var db: Database? = null
    }

    @Primary
    @Bean
    open fun dataSource(): javax.sql.DataSource {
        if (activeProfile.isBlank()) {
            db ?: databaseManager.connect("spring.datasource", false).let {
                dataSource = it.first
                db = it.second
            }
        } else {
            databaseManager.connect("spring.datasource", false).let {
                dataSource = it.first
                db = it.second
            }
        }
        databaseManager.doMigration("spring.datasource", dataSource!!)
        return dataSource!!
    }

    @DependsOn("dataSource")
    @Bean
    open fun transactionManager(): PlatformTransactionManager {
        return DataSourceTransactionManager(dataSource!!)
    }
}
