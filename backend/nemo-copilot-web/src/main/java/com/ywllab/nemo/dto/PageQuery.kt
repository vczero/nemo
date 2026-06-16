package com.ywllab.nemo.dto

import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

open class PageQuery : Serializable {

    companion object {
        private const val serialVersionUID = 23585000277443258L
    }

    @ApiModelProperty("页码, 从1开始")
    var pageNum: Long = 1

    @ApiModelProperty("页长")
    var pageSize: Long = 10

    fun offset(): Long {
        return (pageSize * (pageNum - 1)).coerceAtLeast(0)
    }
}
