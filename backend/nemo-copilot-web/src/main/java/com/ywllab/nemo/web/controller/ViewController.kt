package com.ywllab.nemo.web.controller

import com.ywllab.nemo.dto.ResultDto
import io.swagger.annotations.Api
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ResponseBody

@Api(tags = ["页面"])
@Controller
open class ViewController {

    @Value("\${app.version}")
    lateinit var version: String

    @GetMapping("/api/version")
    @ResponseBody
    open fun version(): ResultDto<Any> {
        return ResultDto(mapOf("version" to version))
    }
}
