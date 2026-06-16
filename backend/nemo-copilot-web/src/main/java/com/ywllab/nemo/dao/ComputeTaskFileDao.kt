package com.ywllab.nemo.dao

import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.model.compute.ComputeTaskFile
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

object ComputeTaskFileDao : Table("nemo_compute_task_file") {
    val fileId = varchar("file_id", 32)
    val taskId = varchar("task_id", 32)
    val fileType = enumerationByName<FileType>("file_type", 32)
    val name = varchar("name", 190)
    val createBy = varchar("create_by", 64)
    val createTime = long("create_time")

    override val primaryKey = PrimaryKey(taskId, fileId, fileType)

    private val self = this

    val mapper = { row: ResultRow -> BaseDao.map(row, ComputeTaskFile()) }

    fun create(taskFile: ComputeTaskFile, operator: String) {
        val now = System.currentTimeMillis()
        transaction {
            self.insert {
                it[fileId] = taskFile.fileId
                it[taskId] = taskFile.taskId
                it[fileType] = taskFile.fileType
                it[name] = taskFile.name
                it[createBy] = operator
                it[createTime] = now
            }
        }
    }

    fun getByTaskId(taskIdParam: String): List<ComputeTaskFile> {
        return transaction {
            self.select { self.taskId eq taskIdParam }
                .map(mapper)
        }
    }

    fun getByTaskIds(taskIds: List<String>): Map<String, List<ComputeTaskFile>> {
        if (taskIds.isEmpty()) return emptyMap()
        return transaction {
            self.select { self.taskId inList taskIds }
                .map(mapper)
                .groupBy { it.taskId }
        }
    }

    fun deleteByTaskId(taskIdParam: String) {
        transaction {
            self.deleteWhere { taskId eq taskIdParam }
        }
    }
}
