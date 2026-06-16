package com.ywllab.nemo.model.compute

import com.ywllab.nemo.constant.FileType
import com.ywllab.nemo.model.BaseColumn
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("计算任务关联文件")
class ComputeTaskFile : BaseColumn() {
    @ApiModelProperty("文件ID")
    lateinit var fileId: String

    @ApiModelProperty("任务ID")
    lateinit var taskId: String

    @ApiModelProperty("文件类型")
    var fileType: FileType = FileType.COMPUTE_INPUT

    @ApiModelProperty("文件标识名")
    lateinit var name: String
}
