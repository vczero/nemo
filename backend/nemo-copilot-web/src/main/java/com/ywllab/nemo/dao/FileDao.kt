package com.ywllab.nemo.dao

import com.ywllab.nemo.model.NemoFile
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object FileDao : BaseDao<NemoFile>("nemo_file") {
    val fileId = varchar("file_id", 32)
    val userId = varchar("user_id", 32)
    val fileName = varchar("file_name", 190)
    val ossPath = varchar("oss_path", 500)
    val fileSize = long("file_size")
    val fileType = varchar("file_type", 50)
    val mimeType = varchar("mime_type", 100).nullable()

    override val primaryKey = PrimaryKey(fileId)

    private val self = this

    override fun createModel(): NemoFile = NemoFile()

    fun create(file: NemoFile) {
        transaction {
            self.insert {
                it[fileId] = file.fileId
                it[userId] = file.userId
                it[fileName] = file.fileName
                it[ossPath] = file.ossPath
                it[fileSize] = file.fileSize
                it[fileType] = file.fileType
                it[mimeType] = file.mimeType
                it[createBy] = file.createBy
                it[createTime] = file.createTime
                it[updateBy] = file.updateBy
                it[updateTime] = file.updateTime
            }
        }
    }

    fun update(file: NemoFile) {
        transaction {
            update({ self.fileId eq file.fileId }) {
                it[fileName] = file.fileName
                it[ossPath] = file.ossPath
                it[fileSize] = file.fileSize
                it[fileType] = file.fileType
                it[mimeType] = file.mimeType
                it[updateBy] = file.updateBy
                it[updateTime] = file.updateTime
            }
        }
    }

    fun getById(id: String): NemoFile? {
        return transaction {
            select { self.fileId eq id }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun listByIds(ids: List<String>): List<NemoFile> {
        return transaction {
            select { self.fileId inList ids }
                .map(mapper)
        }
    }

    fun delete(fileIds: List<String>) {
        transaction {
            deleteWhere { self.fileId inList fileIds }
        }
    }
}
