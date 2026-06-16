package com.ywllab.nemo.model

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("用户扩展信息")
class UserProfile : BaseColumn() {
    @ApiModelProperty("用户ID")
    lateinit var userId: String

    @ApiModelProperty("机构/学校")
    var organization: String? = null

    @ApiModelProperty("真实姓名")
    var realName: String? = null

    @ApiModelProperty("省份")
    var province: String? = null

    @ApiModelProperty("城市")
    var city: String? = null

    @ApiModelProperty("个人简介")
    var bio: String? = null
}
