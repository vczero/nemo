package com.ywllab.nemo.dao

import com.ywllab.nemo.model.Story
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object StoryDao : BaseDao<Story>("nemo_story") {
    val storyId = varchar("story_id", 32)
    val userId = varchar("user_id", 32)
    val title = varchar("title", 190)
    val author = varchar("author", 64)
    val description = varchar("description", 500).nullable()

    override val primaryKey = PrimaryKey(storyId)

    private val self = this

    override val mapper = { row: ResultRow ->
        map(row, createModel(), listOf())
    }

    override fun createModel(): Story = Story()

    fun create(story: Story) {
        transaction {
            self.insert {
                it[storyId] = story.storyId
                it[userId] = story.userId
                it[title] = story.title
                it[author] = story.author
                it[description] = story.description
                it[createBy] = story.createBy
                it[createTime] = System.currentTimeMillis()
                it[updateBy] = story.updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun update(story: Story) {
        transaction {
            update({ self.storyId eq story.storyId }) {
                it[title] = story.title
                it[author] = story.author
                it[description] = story.description
                it[updateBy] = story.updateBy
                it[updateTime] = System.currentTimeMillis()
            }
        }
    }

    fun deleteByStoryId(storyId: String) {
        transaction {
            deleteWhere { self.storyId eq storyId }
        }
    }

    fun getByStoryId(storyId: String, userId: String): Story? {
        return transaction {
            select { self.storyId eq storyId and (self.userId eq userId) }
                .map(mapper)
                .firstOrNull()
        }
    }

    fun pageByUserId(userId: String, pageNum: Int, pageSize: Int): Pair<List<Story>, Long> {
        return transaction {
            val where = self.userId eq userId
            val data = select(where)
                .orderBy(updateTime, SortOrder.DESC)
                .limit(pageSize, (pageNum - 1) * pageSize.toLong())
                .map(mapper)
            val total = select(where).count()
            Pair(data, total)
        }
    }
}
