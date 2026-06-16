package com.ywllab.nemo.dao

import cn.hutool.core.util.ClassUtil
import cn.hutool.crypto.SecureUtil
import cn.hutool.json.JSONUtil
import com.zaxxer.hikari.HikariDataSource
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.DatabaseConfig
import org.jetbrains.exposed.sql.transactions.TransactionManager
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.core.env.Environment
import java.sql.ResultSet
import javax.sql.ConnectionPoolDataSource
import javax.sql.DataSource

@Primary
@Configuration
open class DatabaseManager {

    private val log = LoggerFactory.getLogger(this.javaClass)

    @Autowired
    lateinit var env: Environment

    fun connect(prefix: String, doMigration: Boolean): Pair<DataSource, Database> {
        val dataSource = HikariDataSource()
        dataSource.driverClassName = env.getProperty("$prefix.driverClassName", "com.mysql.cj.jdbc.Driver")
        dataSource.jdbcUrl = env.getProperty("$prefix.url")
        dataSource.username = env.getProperty("$prefix.username")

        // 如果存在 passwordAesKey 属性, 则对 password 解密
        val password = env.getProperty("$prefix.password")
        val passwordAesKey = env.getProperty("$prefix.passwordAesKey")
        dataSource.password = if (passwordAesKey == null) {
            password
        } else {
            SecureUtil.aes(passwordAesKey.toByteArray()).decryptStr(password)
        }

        val database = Database.connect(dataSource)
        log.info("Connected to data source: $prefix")

        if (doMigration) {
            doMigration(prefix, dataSource)
        }

        return Pair(dataSource, database)
    }

    /**
     * 使用已有的ConnectionPoolDataSource
     */
    fun connect(dataSource: ConnectionPoolDataSource): Database {
        return Database.connectPool(
            dataSource, {},
            DatabaseConfig { useNestedTransactions = true }
        )
    }

    fun doMigration(prefix: String, dataSource: DataSource) {
        val table = env.getProperty(
            "$prefix.flyway.table",
            env.getProperty("spring.flyway.table", "flyway_schema_history")
        )
        val locations = getPropertyAsArray(
            "$prefix.flyway.locations",
            getPropertyAsArray("spring.flyway.locations", arrayOf("classpath:db/migration"))
        )
        val baselineVersion = env.getProperty(
            "$prefix.flyway.baselineVersion",
            env.getProperty("spring.flyway.baselineVersion", "1")
        )
        log.info("Flyway migration locations: ${locations.joinToString(",")}")
        Flyway.configure()
            .dataSource(dataSource)
            .baselineOnMigrate(true)
            .baselineVersion(baselineVersion)
            .ignoreMissingMigrations(true)
            .table(table)
            .locations(*locations)
            .load()
            .migrate()
    }

    /**
     * 执行 SQL 查询语句, 参数用 ? 替代
     */
    fun executeQuery(sql: String, args: List<Any>): ResultSet {
        val statement = TransactionManager.current().connection.prepareStatement(sql, true)
        args.forEachIndexed { i, arg -> statement[i + 1] = arg }
        return statement.executeQuery()
    }

    /**
     * 执行 SQL 查询语句,
     * 参数用 ? 替代
     * 结果转成指定类型
     */
    fun <T> executeQuery(sql: String, args: List<Any>, type: Class<T>): List<T> {
        val res = executeQuery(sql, args)
        val items = mapResultSetToPojo(res, type)
        closeResultSet(res)
        return items
    }

    private fun <T> mapResultSetToPojo(resultSet: ResultSet, type: Class<T>): List<T> {
        val items = mutableListOf<T>()
        while (resultSet.next()) {
            val row = mutableMapOf<String, Any?>()
            // 单个java原生类型的查询结果
            val isPrimitive = ClassUtil.isBasicType(type) || type == String::class.java
            if (isPrimitive && resultSet.metaData.columnCount == 1) {
                items.add(resultSet.getObject(1, type))
            } else {
                // resultSet转pojo
                for (i in 1..resultSet.metaData.columnCount) {
                    val key = resultSet.metaData.getColumnLabel(i)
                    row[key] = resultSet.getObject(key)
                }
                items.add(JSONUtil.toBean(JSONUtil.toJsonStr(row), type))
            }
        }
        return items
    }

    /**
     * 关闭 ResultSet, 避免内存泄漏
     */
    fun closeResultSet(resultSet: ResultSet) {
        try {
            if (!resultSet.isClosed) resultSet.close()
        } catch (e: Exception) {
            log.warn(e.message)
        }
        try {
            if (!resultSet.statement.isClosed) resultSet.statement.close()
        } catch (e: Exception) {
            log.warn(e.message)
        }
    }

    /**
     * 执行 SQL 更新语句, 参数用 ? 替代
     */
    fun executeUpdate(sql: String, args: List<Any>): Int {
        val statement = TransactionManager.current().connection.prepareStatement(sql, true)
        args.forEachIndexed { i, arg -> statement[i + 1] = arg }
        val result = statement.executeUpdate()

        try {
            statement.closeIfPossible()
        } catch (e: Exception) {
            log.warn(e.message)
        }
        return result
    }

    /**
     * 支持解析以下两种格式的数组
     * 1) prop: a,b,c
     * 2) prop:
     *      - a
     *      - b
     *      - c
     */
    private fun getPropertyAsArray(key: String, default: Array<String>): Array<String> {
        val prop = env.getProperty(key)
        if (prop == null) {
            return if (env.getProperty("$key[0]") == null) {
                return default
            } else {
                val result = mutableListOf<String>()
                var index = 0
                while (env.getProperty("$key[$index]") != null) {
                    result += env.getProperty("$key[$index]")!!.toString()
                    index++
                }
                result.toTypedArray()
            }
        } else {
            return prop.split(",").toTypedArray()
        }
    }

    companion object {
        /**
         * 执行SQL查询并使用mapper函数转换每一行
         */
        fun <T> query(sql: String, mapper: (ResultSet) -> T): List<T> {
            val connection = TransactionManager.current().connection
            val statement = connection.prepareStatement(sql, false)
            val resultSet = statement.executeQuery()
            val results = mutableListOf<T>()

            while (resultSet.next()) {
                results.add(mapper(resultSet))
            }

            try {
                resultSet.close()
                statement.closeIfPossible()
            } catch (e: Exception) {
                // ignore
            }

            return results
        }

        /**
         * 执行SQL更新语句
         */
        fun executeUpdate(sql: String, vararg args: Any?): Int {
            val connection = TransactionManager.current().connection
            val statement = connection.prepareStatement(sql, false)

            args.forEachIndexed { index, arg ->
                if (arg != null) {
                    statement[index + 1] = arg
                }
            }

            val result = statement.executeUpdate()
            statement.closeIfPossible()

            return result
        }
    }
}
