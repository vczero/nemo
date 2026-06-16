package com.ywllab.nemo.dto

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty
import java.io.Serializable

@ApiModel("分页结果")
class PageResultDto<T> : Serializable {
    @ApiModelProperty("页码, 从1开始")
    var pageNum: Long = 1

    @ApiModelProperty("页长")
    var pageSize: Long = 0

    @ApiModelProperty("总数")
    var total: Long = 0

    @ApiModelProperty("数据")
    var list: List<T> = listOf()

    constructor()

    constructor(list: List<T>, total: Long, pageNum: Long, pageSize: Long) {
        this.list = list
        this.pageNum = pageNum
        this.total = total
        this.pageSize = pageSize
    }

    constructor(list: List<T>, total: Long, pageParam: PageQuery) {
        this.list = list
        this.total = total
        this.pageNum = pageParam.pageNum
        this.pageSize = pageParam.pageSize
    }
}
