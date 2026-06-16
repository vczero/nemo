package com.ywllab.nemo.dao

import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

/**
 * 简单的键值缓存DAO类，用于替代Redis的基本功能
 */
object CacheDao : Table("nemo_cache") {
    val id = long("id").autoIncrement()
    val cacheKey = varchar("cache_key", 190).uniqueIndex() // 适配MySQL索引长度限制
    val cacheType = varchar("cache_type", 190)
    val cacheData = text("cache_data")
    val createTime = long("create_time")

    override val primaryKey = PrimaryKey(id)

    /**
     * 保存缓存数据（简单的K-V存储）
     */
    fun put(key: String, type: String, value: String) {
        transaction {
            // 先删除可能存在的相同键
            deleteWhere { cacheKey eq key }
            // 插入新的键值对
            insert {
                it[cacheKey] = key
                it[cacheType] = type
                it[cacheData] = value
                it[createTime] = System.currentTimeMillis()
            }
        }
    }

    /**
     * 获取缓存数据
     */
    fun get(key: String): String? {
        // fixme debug return null
        return transaction {
            select { cacheKey eq key }
                .map { it[cacheData] }
                .firstOrNull()
        }
    }

    /**
     * 获取缓存数据（带过期时间检查）
     * @param key 缓存键
     * @param ttlMillis 过期时间（毫秒），如果缓存创建时间超过此时间则返回null
     * @return 缓存数据，如果缓存不存在或已过期则返回null
     */
    fun get(key: String, ttlMillis: Long): String? {
        return transaction {
            val result = select { cacheKey eq key }
                .firstOrNull()

            if (result != null) {
                val createTime = result[this@CacheDao.createTime]
                val currentTime = System.currentTimeMillis()

                // 检查是否过期
                if (currentTime - createTime > ttlMillis) {
                    // 缓存已过期，删除并返回null
                    deleteWhere { cacheKey eq key }
                    null
                } else {
                    result[cacheData]
                }
            } else {
                null
            }
        }
    }

    /**
     * 删除指定键的缓存
     */
    fun remove(key: String) {
        transaction {
            deleteWhere { cacheKey eq key }
        }
    }

    /**
     * 清除特定类型的缓存
     */
    fun clearByType(type: String) {
        transaction {
            deleteWhere { cacheType eq type }
        }
    }

    /**
     * 清除所有缓存
     */
    fun clearAll() {
        transaction {
            deleteAll()
        }
    }

    /**
     * 生成缓存键（用于DashboardService中的复杂查询条件组合）
     */
    fun generateKey(vararg params: Any?): String {
        return params.joinToString("_") { it?.toString() ?: "null" }
    }
}
