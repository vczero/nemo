package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.SysctlKey
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insertIgnore
import org.jetbrains.exposed.sql.replace
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import kotlin.time.Duration

object SysctlDao : Table("nemo_sysctl") {

    private val key = varchar("sys_key", 190)
    private val value = text("sys_value")
    private val updateTime = long("update_time")

    private val self = this

    fun get(k: SysctlKey): String? {
        return transaction {
            select { key.eq(k.name) }.map { it[value] }.firstOrNull()
        }
    }

    fun set(k: SysctlKey, v: String) {
        set(k.name, v)
    }

    private fun set(k: String, v: String) {
        transaction {
            replace {
                it[key] = k.trim()
                it[value] = v.trim()
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    // 实现分布式锁
    fun require(key: SysctlKey, value: String, expire: Duration): String {
        val now = System.currentTimeMillis()
        transaction {
            insertIgnore {
                it[SysctlDao.key] = key.name
                it[SysctlDao.value] = value
                it[updateTime] = now
            }
        }
        return transaction {
            update({
                SysctlDao.key.eq(key.name) and updateTime.less(now - expire.inWholeMilliseconds)
            }) {
                it[SysctlDao.value] = value
                it[updateTime] = now
            }
            get(key)!!
        }
    }
}
