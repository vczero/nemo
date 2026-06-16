package com.ywllab.nemo.web.controller

import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.dto.ResultDto
import com.ywllab.nemo.dto.file.FileUploadResponse
import com.ywllab.nemo.service.FileService
import com.ywllab.nemo.util.HttpHeaderUtil
import com.ywllab.nemo.util.SvgPdfUtil
import io.swagger.annotations.Api
import io.swagger.annotations.ApiOperation
import io.swagger.annotations.ApiParam
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream
import javax.servlet.http.HttpServletResponse

@Api(tags = ["文件"])
@RestController
@RequestMapping("/api/files")
open class FileController {
    private val log = LoggerFactory.getLogger(javaClass)

    @Autowired
    lateinit var fileService: FileService

    @Autowired
    lateinit var svgPdfUtil: SvgPdfUtil

    @ApiOperation("上传")
    @PostMapping("/add")
    open fun add(
        @ApiParam("业务类型") @RequestParam("fileType") type: FileType,
        @ApiParam("文件") @RequestParam("file") file: MultipartFile,
    ): ResultDto<FileUploadResponse> {
        val response = fileService.add(type, file)
        return ResultDto.success(response)
    }

    @ApiOperation("更新文件（覆盖）")
    @PostMapping("/{fileId}/update")
    open fun update(
        @ApiParam("业务类型") @RequestParam("fileType") type: FileType,
        @ApiParam("文件ID") @PathVariable fileId: String,
        @ApiParam("文件") @RequestParam("file") file: MultipartFile
    ): ResultDto<FileUploadResponse> {
        val response = fileService.update(type, fileId, file)
        return ResultDto.success(response)
    }

    @ApiOperation("SVG转PDF")
    @PostMapping("/svg-to-pdf")
    open fun convertSvgToPdf(
        @ApiParam("SVG文件") @RequestParam("file") file: MultipartFile,
        response: HttpServletResponse,
        inputStream: InputStream
    ) {
        try {
            response.also {
                HttpHeaderUtil.setExportHeader(it, "${file.originalFilename}.pdf")
                it.contentType = MediaType.APPLICATION_PDF_VALUE
            }
            val remoteInput = svgPdfUtil.convertSvgToPdf(file)
            remoteInput.use { input ->
                input.copyTo(response.outputStream)
            }
        } catch (e: Throwable) {
            log.error("SVG转PDF失败:${e.message}", e)
            response.status = HttpStatus.INTERNAL_SERVER_ERROR.value()
        }
    }
}
