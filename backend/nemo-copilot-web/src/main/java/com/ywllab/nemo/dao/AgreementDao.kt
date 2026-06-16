package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.AgreementType
import com.ywllab.nemo.dto.agreement.AgreementPageRequest
import com.ywllab.nemo.dto.agreement.AgreementPageResponse
import com.ywllab.nemo.model.Agreement
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object AgreementDao : BaseDao<Agreement>("nemo_agreement") {
    val agreementId = varchar("agreement_id", 32)
    val type = varchar("type", 32)
    val version = varchar("version", 32)
    val title = varchar("title", 500)
    val content = text("content")
    val ossPath = varchar("oss_path", 500).nullable()
    val isActive = integer("is_active").default(0)
    val effectiveDate = long("effective_date").nullable()
    override val primaryKey = PrimaryKey(agreementId)

    private val self = this

    override fun createModel(): Agreement {
        return Agreement()
    }

    fun getById(id: String): Agreement? {
        return transaction {
            select { self.agreementId eq id }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun countByIds(ids: List<String>): Int {
        return transaction {
            select { self.agreementId inList ids }
                .count().toInt()
        }
    }

    fun getActive(type: AgreementType? = null): Agreement? {
        return transaction {
            val condition = if (type != null) {
                (self.isActive eq 1) and (self.type eq type.name)
            } else {
                self.isActive eq 1
            }
            select { condition }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun getActiveList(): List<Agreement> {
        return transaction {
            select { self.isActive eq 1 }
                .map(mapper)
        }
    }

    fun list(request: AgreementPageRequest): Pair<List<AgreementPageResponse>, Long> {
        return transaction {
            var condition: Op<Boolean> = Op.TRUE
            if (request.type != null) {
                condition = condition and (self.type eq request.type!!.name)
            }
            if (request.isActive != null) {
                condition = condition and (self.isActive eq request.isActive!!)
            }

            val total = select(condition).count()

            val data = select(condition)
                .orderBy(createTime, SortOrder.DESC)
                .limit(request.pageSize.toInt(), request.offset())
                .map { row ->
                    AgreementPageResponse().apply {
                        agreementId = row[self.agreementId]
                        type = AgreementType.valueOf(row[self.type])
                        version = row[self.version]
                        title = row[self.title]
                        isActive = row[self.isActive]
                        effectiveDate = row[self.effectiveDate]
                        createBy = row[self.createBy]
                        createTime = row[self.createTime]
                        updateBy = row[self.updateBy]
                        updateTime = row[self.updateTime]
                    }
                }

            Pair(data, total)
        }
    }

    fun existsByVersion(version: String, type: AgreementType): Boolean {
        return transaction {
            select { (self.version eq version) and (self.type eq type.name) }
                .count() > 0
        }
    }

    fun create(agreement: Agreement) {
        transaction {
            self.insert {
                it[agreementId] = agreement.agreementId
                it[self.type] = agreement.type.name
                it[version] = agreement.version
                it[title] = agreement.title
                it[content] = agreement.content
                it[ossPath] = agreement.ossPath
                it[isActive] = agreement.isActive
                it[effectiveDate] = agreement.effectiveDate
                it[createBy] = agreement.createBy
                it[createTime] = agreement.createTime
                it[updateBy] = agreement.updateBy
                it[updateTime] = agreement.updateTime
            }
        }
    }

    fun activate(agreementId: String, effectiveDate: Long, updateBy: String) {
        transaction {
            // 获取要激活的协议类型
            val targetType = select { self.agreementId eq agreementId }
                .map { it[self.type] }
                .firstOrNull() ?: return@transaction

            // 先将该类型下所有激活协议设为未激活
            update({ (self.isActive eq 1) and (self.type eq targetType) }) {
                it[isActive] = 0
            }

            // 激活指定协议
            update({ self.agreementId eq agreementId }) {
                it[isActive] = 1
                it[self.effectiveDate] = effectiveDate
                it[self.updateBy] = updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun deleteById(id: String) {
        transaction {
            deleteWhere { self.agreementId eq id }
        }
    }
}
