package com.ywllab.nemo.service

import cn.hutool.core.util.IdUtil
import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.dao.FileDao
import com.ywllab.nemo.dto.file.FileUploadResponse
import com.ywllab.nemo.exception.NotFoundException
import com.ywllab.nemo.exception.ParamException
import com.ywllab.nemo.model.NemoFile
import com.ywllab.nemo.service.UserSessionHelper.getUserId
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile

@Service
open class FileService {
    private val log = LoggerFactory.getLogger(FileService::class.java)

    @Autowired
    private lateinit var ossService: OssService

    open fun update(
        type: FileType,
        fileId: String,
        file: MultipartFile,
        encryptUrl: Boolean = true
    ): FileUploadResponse {
        if (file.isEmpty) {
            throw ParamException("文件不能为空")
        }

        val userId = getUserId()
        val existingFile = FileDao.getById(fileId)
            ?: throw NotFoundException("文件不存在")

        // 权限验证
        if (existingFile.userId != userId) {
            throw ParamException("没有权限更新此文件")
        }

        val now = System.currentTimeMillis()
        val originalFilename = file.originalFilename ?: "unknown"

        // 删除旧OSS文件
        ossService.deleteFile(existingFile.ossPath)

        // 上传新文件到OSS
        val (ossPath, fileSize) = ossService.uploadFile(type, file, userId)
        val url = if (encryptUrl) {
            ossService.generatePresignedUrl(ossPath)
        } else {
            ossService.getPublicUrl(ossPath)
        }

        // 更新数据库记录
        existingFile.apply {
            fileName = originalFilename
            this.ossPath = ossPath
            this.fileSize = fileSize
            fileType = getFileExtension(originalFilename)
            mimeType = file.contentType
            updateBy = userId
            updateTime = now
        }

        FileDao.update(existingFile)

        log.info("File updated, fileId={}, userId={}, size={}", fileId, userId, fileSize)

        return FileUploadResponse().apply {
            this.fileId = fileId
            fileName = originalFilename
            this.ossPath = existingFile.ossPath
            this.url = url
            this.fileSize = fileSize
        }
    }

    open fun add(type: FileType, file: MultipartFile, encryptUrl: Boolean = true): FileUploadResponse {
        if (file.isEmpty) {
            throw ParamException("文件不能为空")
        }

        val userId = getUserId()
        val originalFilename = file.originalFilename ?: "unknown"

        // 上传到OSS
        val (ossPath, fileSize) = ossService.uploadFile(type, file, userId)
        // INVOICE 类型返回 OSS 内部路径（以 / 开头），便于后续下载附件
        val url = when {
            type == FileType.INVOICE -> ossPath
            type == FileType.AVATAR -> ossPath
            encryptUrl -> ossService.generatePresignedUrl(ossPath)
            else -> ossService.getPublicUrl(ossPath)
        }

        val now = System.currentTimeMillis()
        // 创建文件记录
        val nemoFile = NemoFile().apply {
            fileId = IdUtil.getSnowflakeNextIdStr()
            this.userId = userId
            fileName = originalFilename
            this.ossPath = ossPath
            this.fileSize = fileSize
            fileType = getFileExtension(originalFilename)
            mimeType = file.contentType
            createBy = userId
            createTime = now
            updateBy = userId
            updateTime = now
        }
        FileDao.create(nemoFile)

        log.info("File uploaded, fileId={}, userId={}, size={}", nemoFile.fileId, userId, fileSize)

        return FileUploadResponse().apply {
            fileId = nemoFile.fileId
            fileName = originalFilename
            this.ossPath = ossPath
            this.url = url
            this.fileSize = fileSize
        }
    }

    private fun getFileExtension(filename: String): String {
        val lastDot = filename.lastIndexOf('.')
        return if (lastDot > 0) filename.substring(lastDot + 1) else ""
    }
}
