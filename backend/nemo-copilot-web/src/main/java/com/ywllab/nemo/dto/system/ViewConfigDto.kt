package com.ywllab.nemo.dto.system

import io.swagger.annotations.ApiModel
import io.swagger.annotations.ApiModelProperty

@ApiModel("系统配置")
class SystemConfigDto {

    @ApiModelProperty("前端视图配置")
    var viewConfig: ViewConfigDto = ViewConfigDto()
}

@ApiModel("前端视图配置")
class ViewConfigDto {

    @ApiModelProperty("Banner 配置")
    var banner: BannerDto = BannerDto()

    @ApiModelProperty("导航菜单")
    var menus: List<MenuDto> = emptyList()

    @ApiModel("Banner 配置")
    class BannerDto {
        @ApiModelProperty("Banner 链接")
        var link: String = ""

        @ApiModelProperty("Banner 图片URL")
        var imageUrl: String = ""
    }

    @ApiModel("导航菜单项")
    class MenuDto {
        @ApiModelProperty("菜单名称")
        var name: String = ""

        @ApiModelProperty("导航地址")
        var link: String = ""
    }
}
