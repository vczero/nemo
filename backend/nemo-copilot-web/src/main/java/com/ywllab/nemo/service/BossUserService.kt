package com.ywllab.nemo.service

import com.ywllab.nemo.constant.BossUserType
import com.ywllab.nemo.dao.BossUserRelationDao
import com.ywllab.nemo.dao.UserDao
import com.ywllab.nemo.dto.user.BossUserRelationRequest
import com.ywllab.nemo.exception.BizException
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.model.BossUserRelation
import org.springframework.stereotype.Service

@Service
open class BossUserService {

    /**
     * 获取所有Boss用户关联列表
     */
    open fun listBossUserRelations(): List<BossUserRelation> {
        return BossUserRelationDao.getAll()
    }

    /**
     * 根据用户ID获取Boss用户关联
     */
    open fun getBossUserRelation(userId: String): BossUserRelation? {
        return BossUserRelationDao.getByUserId(userId)
    }

    /**
     * 新增Boss用户关联
     */
    open fun createBossUserRelation(request: BossUserRelationRequest): String {
        // 检查用户是否存在
        val user = UserDao.getById(request.userId)
            ?: throw NotFoundException("用户不存在")

        // 检查是否已是Boss用户
        if (BossUserRelationDao.existsByUserId(request.userId)) {
            throw BizException("该用户已是Boss用户")
        }

        // 校验并转换用户类型
        val userType = BossUserType.fromValue(request.userType)
            ?: throw BizException("用户类型不正确，有效值：ADMIN-管理员 EDIT-编辑 READ-只读")

        val relation = BossUserRelation().apply {
            userId = request.userId
            this.userType = userType
            createBy = UserSessionHelper.getUsername()
            createTime = System.currentTimeMillis()
        }
        BossUserRelationDao.create(relation)
        return "添加成功"
    }

    /**
     * 更新Boss用户关联
     */
    open fun updateBossUserRelation(request: BossUserRelationRequest): String {
        val relation = BossUserRelationDao.getByUserId(request.userId)
            ?: throw NotFoundException("Boss用户关联不存在")

        // 校验并转换用户类型
        val userType = BossUserType.fromValue(request.userType)
            ?: throw BizException("用户类型不正确，有效值：ADMIN-管理员 EDIT-编辑 READ-只读")

        relation.userType = userType
        BossUserRelationDao.update(relation)
        return "更新成功"
    }

    /**
     * 删除Boss用户关联
     */
    open fun deleteBossUserRelation(userId: String) {
        if (!BossUserRelationDao.existsByUserId(userId)) {
            throw NotFoundException("Boss用户关联不存在")
        }
        BossUserRelationDao.deleteByUserId(userId)
    }

    /**
     * 检查用户是否有Boss系统访问权限
     */
    open fun hasBossAccess(userId: String): Boolean {
        return BossUserRelationDao.existsByUserId(userId)
    }
}
