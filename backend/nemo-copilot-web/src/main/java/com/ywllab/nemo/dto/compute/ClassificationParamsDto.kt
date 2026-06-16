package com.ywllab.nemo.dto.compute

import com.ywllab.nemo.constant.ClassificationType
import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

/**
 * 分类任务参数DTO
 */
@ApiModel("分类任务参数")
class ClassificationParamsDto {
    @ApiModelProperty("分类类别列表", required = true)
    var categories: List<ClassificationCategoryDto> = emptyList()

    @ApiModelProperty("分类类型", required = true)
    var classificationType: ClassificationType = ClassificationType.SINGLE_CLASS

    class ClassificationCategoryDto {
        @ApiModelProperty("类别名称", required = true)
        lateinit var category: String

        @ApiModelProperty("类别描述", required = true)
        var description: String? = null
    }
}
