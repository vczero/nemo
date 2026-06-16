package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.model.compute.ComputeTaskFile
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("任务文件")
class TaskFileDto {
    @ApiModelProperty("文件ID")
    var fileId: String? = null

    @ApiModelProperty("文件标识名")
    var name: String? = null

    @ApiModelProperty("文件下载地址")
    var fileUrl: String? = null

    @ApiModelProperty("文件类型")
    var fileType: FileType? = null

    @ApiModelProperty("文件大小（字节）")
    var fileSize: Long? = null

    @ApiModelProperty("关联时间")
    var createTime: Long? = null

    constructor()

    constructor(tf: ComputeTaskFile, fileUrl: String?, fileSize: Long?) {
        this.fileId = tf.fileId
        this.name = tf.name
        this.fileUrl = fileUrl
        this.fileType = tf.fileType
        this.fileSize = fileSize
        this.createTime = tf.createTime
    }
}
