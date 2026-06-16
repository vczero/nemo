package com.ywllab.nemo.web.boss.controller

import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.file.FileUploadResponse
import com.ywllab.nemo.service.FileService
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@Api(tags = ["文件"])
@RestController
@RequestMapping("/boss/api/files")
open class BossFileController {
    @Autowired
    lateinit var fileService: FileService

    @ApiOperation("上传")
    @PostMapping("/add")
    open fun uploadFile(
        @ApiParam("业务类型") @RequestParam("fileType") type: FileType,
        @ApiParam("文件") @RequestParam("file") file: MultipartFile,
    ): ResultDto<FileUploadResponse> {
        val response = fileService.add(type, file)
        return ResultDto.success(response)
    }
}
